import emailService from '../services/emailService.js';
import Deployment from '../schema/Deployment.js';
import Candidate from '../schema/Candidate.js';
import Employee from '../schema/Employee.js';

class EmailController {
 async sendDeploymentEmail(req, res) {
  try {

    const {
      candidateId,
      formData,
      recipientEmails,
      ccEmails = [],
      subject = '',
      content = '',
      senderEmpId
    } = req.body;

    // Validation
    if (!formData || !candidateId) {
      return res.status(400).json({
        success: false,
        message: 'Form data and candidate ID are required'
      });
    }

    if (!senderEmpId) {
      return res.status(400).json({
        success: false,
        message: 'Sender employee ID is required'
      });
    }

    if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one recipient email is required'
      });
    }

    // Filter valid emails
    const validEmails = recipientEmails.filter(email => email && email.trim());
    const validCcEmails = ccEmails ? ccEmails.filter(email => email && email.trim()) : [];

    if (validEmails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid recipient emails provided'
      });
    }

    // Get candidate with additional fields needed for deployment tracking
    const candidate = await Candidate.findById(candidateId)
      .select('fullName permanentEmployeeId employeeId mobileNumber officeEmail experienceLevel assignedTeam batchLabel deploymentEmailSent');
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // ✅ CHECK: Prevent duplicate emails
    if (candidate.deploymentEmailSent) {
      return res.status(400).json({
        success: false,
        message: 'Deployment email has already been sent for this candidate'
      });
    }

    const sender = await Employee.findOne({ empId: senderEmpId }).select('name managerEmailConfig');
    if (!sender) {
      return res.status(404).json({
        success: false,
        message: 'Sender employee not found'
      });
    }

    // Send email
    const result = await emailService.sendDeploymentEmail(
      formData,
      validEmails,
      validCcEmails,
      subject,
      content,
      senderEmpId
    );

    // Check if deployment record already exists for this candidate
    let deployment = await Deployment.findOne({ 
      candidateId: candidate._id
    });

    if (deployment) {
      // Update existing deployment record
      deployment.emailSubject = subject || 'Employee Deployment Notice';
      deployment.emailContent = content || '';
      deployment.recipientEmails = validEmails;
      deployment.ccEmails = validCcEmails;
      deployment.emailStatus = result.data?.failed > 0 ? 'Partially Sent' : 'Sent';
      deployment.emailResults = {
        successful: result.data?.successful || 0,
        failed: result.data?.failed || 0,
        total: result.data?.total || 0
      };
      await deployment.save();
    } else {
      // Create new deployment record
      deployment = new Deployment({
        candidateId: candidate._id,
        candidateName: candidate.fullName,
        candidateEmpId: candidate.permanentEmployeeId || candidate.employeeId,
        
        // Deployment details from form
        role: formData.role || '',
        email: formData.email || '',
        office: formData.office || '',
        modeOfHire: formData.modeOfHire || '',
        fromTeam: formData.fromTeam || '',
        toTeam: formData.toTeam || '',
        client: formData.client || '',
        bu: formData.bu || '',
        reportingTo: formData.reportingTo || '',
        accountManager: formData.accountManager || '',
        deploymentDate: formData.deploymentDate && formData.deploymentDate.trim() ? 
          new Date(formData.deploymentDate) : null,
        
        // Populate candidate data for deployment tracking
        candidateMobile: candidate.mobileNumber || '',
        candidateOfficeEmail: candidate.officeEmail || '',
        candidateExperienceLevel: candidate.experienceLevel || '',
        candidateAssignedTeam: candidate.assignedTeam || '',
        candidateBatch: candidate.batchLabel || '',
        
        // Default empty values for fields to be filled via modal
        track: '',
        hrName: '',
        calAdd: '',
        dmDal: '',
        tlLeadRec: '',
        zoomNo: '',
        workLocation: '',
        doj: null,
        extension: '',
        status: 'Active',
        exitDate: null,
        internalTransferDate: null,
        leadOrNonLead: '',
        
        // Email details
        emailSubject: subject || 'Employee Deployment Notice',
        emailContent: content || '',
        recipientEmails: validEmails,
        ccEmails: validCcEmails,
        
        // Sender info
        sentBy: senderEmpId,
        sentByName: sender.name,
        sentFromEmail: sender.managerEmailConfig?.email || '',
        
        // Email results
        emailStatus: result.data?.failed > 0 ? 'Partially Sent' : 'Sent',
        emailResults: {
          successful: result.data?.successful || 0,
          failed: result.data?.failed || 0,
          total: result.data?.total || 0
        }
      });

      await deployment.save();
    }

    // ✅ CRITICAL UPDATE: Mark candidate as deployed
    const updatedCandidate = await Candidate.findByIdAndUpdate(
      candidateId,
      {
        $set: {
          deploymentEmailSent: true,
          deploymentEmailSentAt: new Date(),
          deploymentEmailSentBy: senderEmpId,
          deploymentRecordId: deployment._id,
          deploymentStatus: 'deployed',
          lastUpdated: new Date()
        }
      },
      { new: true }
    );

    // ✅ ENHANCED RESPONSE: Include deployment status for frontend
    res.status(200).json({
      success: true,
      message: `Deployment email sent to ${validEmails.length} recipients${validCcEmails.length > 0 ? ` (CC: ${validCcEmails.length})` : ''}`,
      data: {
        ...result.data,
        deploymentId: deployment._id,
        // ✅ ADD: Critical fields for frontend to update UI immediately
        candidateId: candidateId,
        deploymentEmailSent: true,
        deploymentStatus: 'deployed',
        candidateName: candidate.fullName,
        switchToDeployedTab: true // ✅ Signal frontend to switch tabs
      }
    });

  } catch (error) {

    if (error.message.includes('does not have email permissions') ||
        error.message.includes('No active delivery manager found')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: ' + error.message,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to send deployment email',
      error: error.message
    });
  }
}

 // Updated: Send Internal Transfer Email - Updates existing deployment record
 async sendInternalTransferEmail(req, res) {
   try {

     const {
       deploymentId,
       formData,
       recipientEmails,
       ccEmails = [],
       subject = '',
       content = '',
       senderEmpId
     } = req.body;

     // Validation
     if (!formData || !deploymentId) {
       return res.status(400).json({
         success: false,
         message: 'Form data and deployment ID are required'
       });
     }

     if (!senderEmpId) {
       return res.status(400).json({
         success: false,
         message: 'Sender employee ID is required'
       });
     }

     if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
       return res.status(400).json({
         success: false,
         message: 'At least one recipient email is required'
       });
     }

     // Filter valid emails
     const validEmails = recipientEmails.filter(email => email && email.trim());
     const validCcEmails = ccEmails ? ccEmails.filter(email => email && email.trim()) : [];

     if (validEmails.length === 0) {
       return res.status(400).json({
         success: false,
         message: 'No valid recipient emails provided'
       });
     }

     // Get deployment record
     const deployment = await Deployment.findById(deploymentId);
     if (!deployment) {
       return res.status(404).json({
         success: false,
         message: 'Deployment record not found'
       });
     }

     const sender = await Employee.findOne({ empId: senderEmpId }).select('name managerEmailConfig');
     if (!sender) {
       return res.status(404).json({
         success: false,
         message: 'Sender employee not found'
       });
     }

     // Send internal transfer email
     const result = await emailService.sendInternalTransferEmail(
       formData,
       validEmails,
       validCcEmails,
       subject,
       content,
       senderEmpId
     );

     // Update the existing deployment record with transfer info
     await Deployment.findByIdAndUpdate(deploymentId, {
       internalTransferDate: new Date(),
       internalTransferEmailSent: true,
       internalTransferSubject: subject || 'Internal Transfer Notice',
       internalTransferContent: content || '',
       internalTransferRecipients: validEmails,
       internalTransferCc: validCcEmails,
       internalTransferSentBy: senderEmpId,
       internalTransferSentByName: sender.name,
       internalTransferSentAt: new Date()
     });

     res.status(200).json({
       success: true,
       message: `Internal transfer email sent to ${validEmails.length} recipients${validCcEmails.length > 0 ? ` (CC: ${validCcEmails.length})` : ''}`,
       data: result.data
     });

   } catch (error) {
     if (error.message.includes('does not have email permissions') ||
         error.message.includes('No active delivery manager found')) {
       return res.status(403).json({
         success: false,
         message: 'Access denied: ' + error.message,
         error: error.message
       });
     }

     res.status(500).json({
       success: false,
       message: 'Failed to send internal transfer email',
       error: error.message
     });
   }
 }

 async testEmailConfig(req, res) {
   try {
     const result = await emailService.testEmailConfig();

     res.status(200).json({
       success: result.success,
       message: result.message
     });
   } catch (error) {
     res.status(500).json({
       success: false,
       message: 'Failed to test email configuration',
       error: error.message
     });
   }
 }
}

const emailController = new EmailController();
export default emailController;