export const generateDeploymentEmailTemplate = (formData, content = '') => {
    const {
        name, empId, role, email, office, modeOfHire,
        fromTeam, toTeam, reportingTo, accountManager, deploymentDate,
        client, bu
    } = formData;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Employee Deployment Notice</title>
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
                background-color: #2c3e50;
                color: white; 
                padding: 25px; 
                text-align: center; 
                border-bottom: 3px solid #34495e;
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
            .deployment-table {
                width: 100%;
                min-width: 1000px;  /* Increased for new columns */
                border-collapse: collapse;
                font-size: 13px;
                border-radius: 4px;
                overflow: hidden;
            }
            .deployment-table th {
                background-color: #000000;
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
            .deployment-table td {
                background-color: #ffffff;
                color: #2c3e50;
                padding: 14px 12px;
                border-bottom: 1px solid #ecf0f1;
                font-size: 13px;
                font-weight: 500;
                white-space: nowrap;
            }
            .deployment-table tr:last-child td {
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
                background-color: #f8f9fa;
                border-left: 4px solid #2c3e50;
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
                .deployment-table {
                    min-width: 900px; /* Adjusted for new columns */
                    font-size: 12px;
                }
                .deployment-table th,
                .deployment-table td {
                    padding: 10px 8px;
                    font-size: 11px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            
            <div class="content">

                ${content ? `
                <div style="background-color: #fff;border-radius: 4px; padding: 20px; margin: 20px 0;">
                  <p style="color: #555; line-height: 1.6; margin-bottom: 0;">${content.replace(/\n/g, '<br>')}</p>
                </div>
                ` : ''}

                <div class="table-container">
                    <table class="deployment-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Employee ID</th>
                                <th>Role</th>
                                <th>Email</th>
                                <th>Office</th>
                                <th>Mode of Hire</th>
                                <th>From Team</th>
                                <th>To Team</th>
                                <th>Client</th>
                                <th>BU</th>
                                <th>Reporting To</th>
                                <th>Account Manager</th>
                                <th>Deployment Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>${name || 'Not specified'}</strong></td>
                                <td>${empId || 'Not specified'}</td>
                                <td>${role || 'Not specified'}</td>
                                <td>${email || 'Not specified'}</td>
                                <td>${office || 'Not specified'}</td>
                                <td>${modeOfHire || 'Not specified'}</td>
                                <td>${fromTeam || 'Not specified'}</td>
                                <td>${toTeam || 'Not specified'}</td>
                                <td><strong>${client || 'Not specified'}</strong></td>
                                <td><strong>${bu || 'Not specified'}</strong></td>
                                <td>${reportingTo || 'Not specified'}</td>
                                <td>${accountManager || 'Not specified'}</td>
                                <td>${deploymentDate ? new Date(deploymentDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) : 'Not specified'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
           
        </div>
    </body>
    </html>
    `;
};