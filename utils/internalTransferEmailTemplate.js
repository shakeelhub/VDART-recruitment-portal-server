export const generateInternalTransferEmailTemplate = (formData, content = '') => {
    const {
        name, empId, role, emailId, office, modeOfHire,
        fromTeam, toTeam, reportingTo, accountManager, deploymentDate
    } = formData;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Internal Transfer Notice</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 0; 
                padding: 20px;
                background-color: #f8f9fa;
            }
            .container { 
                max-width: 1000px; 
                margin: 0 auto; 
                background-color: white;
                border-radius: 4px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .header { 
                background-color: #3498db;
                color: white; 
                padding: 25px; 
                text-align: center; 
                border-bottom: 3px solid #2980b9;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
                letter-spacing: 0.5px;
            }
            .header p {
                margin: 8px 0 0 0;
                font-size: 14px;
                opacity: 0.9;
            }
            .content { 
                padding: 35px; 
            }
            .table-container {
                overflow-x: auto;
                margin: 25px 0;
                border-radius: 4px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .transfer-table {
                width: 100%;
                min-width: 900px;
                border-collapse: collapse;
                font-size: 13px;
                border-radius: 4px;
                overflow: hidden;
            }
            .transfer-table th {
                background-color: #2c3e50;
                color: #ffffff;
                padding: 14px 12px;
                text-align: left;
                font-weight: 600;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                border: none;
                white-space: nowrap;
            }
            .transfer-table td {
                background-color: #ffffff;
                color: #2c3e50;
                padding: 14px 12px;
                border-bottom: 1px solid #ecf0f1;
                font-size: 13px;
                font-weight: 500;
                white-space: nowrap;
            }
            .transfer-table tr:last-child td {
                border-bottom: none;
            }
            .footer { 
                text-align: center; 
                padding: 20px; 
                color: #7f8c8d; 
                font-size: 11px;
                background-color: #ecf0f1;
                border-top: 1px solid #bdc3c7;
            }
            .notice {
                background-color: #e8f4fd;
                border-left: 4px solid #3498db;
                padding: 15px;
                margin: 25px 0;
                font-size: 13px;
                color: #555;
            }
            .company-info {
                text-align: center;
                margin-bottom: 5px;
                font-weight: 600;
            }
            .transfer-highlight {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                padding: 15px;
                border-radius: 4px;
                margin: 20px 0;
                text-align: center;
            }
            .transfer-highlight strong {
                color: #856404;
                font-size: 16px;
            }
            
            /* Mobile Responsiveness */
            @media only screen and (max-width: 600px) {
                body {
                    padding: 10px;
                }
                .content {
                    padding: 20px;
                }
                .header {
                    padding: 20px;
                }
                .header h1 {
                    font-size: 20px;
                }
                .table-container {
                    margin: 15px -20px;
                    border-radius: 0;
                }
                .transfer-table {
                    min-width: 800px;
                    font-size: 12px;
                }
                .transfer-table th,
                .transfer-table td {
                    padding: 10px 8px;
                    font-size: 11px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔄 Internal Transfer Notice</h1>
                <p>Employee Movement & Team Reassignment</p>
            </div>
            
            <div class="content">
                <div class="transfer-highlight">
                    <strong>📋 Internal Transfer Notification</strong>
                    <p style="margin: 10px 0 0 0; color: #856404;">This email contains details about an internal employee transfer.</p>
                </div>

                ${content ? `
                <div style="background-color: #f8f9fa;border-radius: 4px; padding: 20px; margin: 20px 0;">
                  <p style="color: #555; line-height: 1.6; margin-bottom: 0;">${content.replace(/\n/g, '<br>')}</p>
                </div>
                ` : ''}

                <div class="table-container">
                    <table class="transfer-table">
                        <thead>
                            <tr>
                                <th>Employee Name</th>
                                <th>Employee ID</th>
                                <th>Role</th>
                                <th>Email ID</th>
                                <th>Office</th>
                                <th>Mode of Hire</th>
                                <th>From Team</th>
                                <th>To Team</th>
                                <th>Reporting To</th>
                                <th>Account Manager</th>
                                <th>Transfer Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>${name || 'Not specified'}</strong></td>
                                <td><span style="background-color: #3498db; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">${empId || 'Not specified'}</span></td>
                                <td>${role || 'Not specified'}</td>
                                <td>${emailId || 'Not specified'}</td>
                                <td>${office || 'Not specified'}</td>
                                <td>${modeOfHire || 'Not specified'}</td>
                                <td style="background-color: #ffeaa7; font-weight: 600;">${fromTeam || 'Not specified'}</td>
                                <td style="background-color: #d4edda; font-weight: 600; color: #155724;">${toTeam || 'Not specified'}</td>
                                <td>${reportingTo || 'Not specified'}</td>
                                <td>${accountManager || 'Not specified'}</td>
                                <td><strong>${deploymentDate ? new Date(deploymentDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) : 'Not specified'}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="notice">
                   
                </div>
            </div>

        </div>
    </body>
    </html>
    `;
};