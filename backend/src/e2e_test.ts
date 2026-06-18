import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = `http://127.0.0.1:${process.env.PORT || 5000}`;

async function runTest() {
  console.log('=== STARTING SERVICE DESK E2E PROGRAMMATIC API TEST ===\n');
  let user1Token = '';
  let managerToken = '';
  let employeeToken = '';
  let ticketId = '';

  const results = {
    loginWithEmail: false,
    loginWithUsername: false,
    createTicket: false,
    createTicketOnBehalfOf: false,
    assignTicket: false,
    statusToInProgress: false,
    statusToResolved: false,
    reopenTicket: false,
    closeTicket: false,
    verifyDetail: false,
  };

  try {
    // 1. Test Login with Email (User 1)
    console.log('1. Testing user1 login with email...');
    const loginEmailRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail: 'user1@company.com', password: '123456' }),
    });
    const emailData = await loginEmailRes.json() as any;
    if (loginEmailRes.status === 200 && emailData.token) {
      console.log('✓ Login with email success!');
      user1Token = emailData.token;
      results.loginWithEmail = true;
    } else {
      console.error('✗ Login with email failed:', emailData);
    }

    // 2. Test Login with Username (User 1)
    console.log('\n2. Testing user1 login with username...');
    const loginUserRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail: 'user1', password: '123456' }),
    });
    const userData = await loginUserRes.json() as any;
    if (loginUserRes.status === 200) {
      console.log('✓ Login with username success!');
      results.loginWithUsername = true;
    } else {
      console.error('✗ Login with username failed:', userData);
    }

    // Login Manager and Employee for subsequent steps
    console.log('\nLogging in Manager and Employee1...');
    const loginManagerRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail: 'manager', password: '123456' }),
    });
    managerToken = ((await loginManagerRes.json()) as any).token;

    const loginEmpRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail: 'employee1', password: '123456' }),
    });
    employeeToken = ((await loginEmpRes.json()) as any).token;

    if (!user1Token || !managerToken || !employeeToken) {
      throw new Error('Could not obtain authorization tokens for E2E testing.');
    }

    // 3. Create Ticket (User 1)
    console.log('\n3. Creating ticket as user1...');
    const createRes = await fetch(`${BASE_URL}/api/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        title: 'Wifi phòng 405 chập chờn - E2E',
        category_id: 'c1111111-1111-1111-1111-111111111111', // Lỗi mạng Wifi
        priority: 'high',
        dynamic_data: {
          room_number: 'Phòng 405',
          connection_type: 'Wifi',
        },
        attachments: [
          {
            file_name: 'test_log.txt',
            file_type: 'text/plain',
            file_data: 'SGVsbG8gV29ybGQh' // "Hello World!" in base64
          }
        ]
      }),
    });
    const createData = await createRes.json() as any;
    if (createRes.status === 201 && createData.ticket?.id) {
      ticketId = createData.ticket.id;
      console.log(`✓ Ticket created successfully! ID: ${ticketId}`);
      results.createTicket = true;
    } else {
      console.error('✗ Ticket creation failed:', createData);
    }

    // 3b. Create Ticket on Behalf of User 3 with manual Location Override (User 1)
    console.log('\n3b. Creating ticket on behalf of user3 with location override...');
    const createBehalfRes = await fetch(`${BASE_URL}/api/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        title: 'Cần cấp phát laptop mới cho nhân viên mới - On Behalf',
        requester_email: 'user3@company.com',
        location_id: '33333333-3333-3333-3333-333333333333', // Chi nhánh Q1
        category_id: 'c1111111-1111-1111-1111-111111111111',
        priority: 'low',
        dynamic_data: {
          room_number: 'Phòng Q1-A',
          connection_type: 'Wifi',
        },
      }),
    });
    const createBehalfData = await createBehalfRes.json() as any;
    if (createBehalfRes.status === 201 && createBehalfData.ticket?.id) {
      const behalfTicketId = createBehalfData.ticket.id;
      console.log(`✓ On-behalf ticket created! ID: ${behalfTicketId}`);
      
      const behalfDetailRes = await fetch(`${BASE_URL}/api/tickets/${behalfTicketId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${managerToken}` },
      });
      const behalfDetail = await behalfDetailRes.json() as any;
      if (behalfDetailRes.status === 200) {
        console.log(`  Requester ID in DB: ${behalfDetail.requester_id} (Expected: f3333333-3333-3333-3333-333333333333)`);
        console.log(`  Creator ID in DB: ${behalfDetail.creator_id} (Expected: f1111111-1111-1111-1111-111111111111)`);
        console.log(`  Location ID in DB: ${behalfDetail.location_id} (Expected: 33333333-3333-3333-3333-333333333333)`);
        
        if (
          behalfDetail.requester_id === 'f3333333-3333-3333-3333-333333333333' &&
          behalfDetail.creator_id === 'f1111111-1111-1111-1111-111111111111' &&
          behalfDetail.location_id === '33333333-3333-3333-3333-333333333333'
        ) {
          console.log('✓ Verified creator, requester, and location integrity correctly!');
          results.createTicketOnBehalfOf = true;
        } else {
          console.error('✗ Creator or requester mismatch in database properties.');
        }
      } else {
        console.error('✗ Failed to retrieve on-behalf ticket details:', behalfDetail);
      }
    } else {
      console.error('✗ On-behalf ticket creation failed:', createBehalfData);
    }

    // 4. Assign Ticket (Manager)
    console.log('\n4. Assigning ticket to employee1 as manager...');
    const assignRes = await fetch(`${BASE_URL}/api/tickets/${ticketId}/assign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`,
      },
      body: JSON.stringify({
        assignee_id: 'e1111111-1111-1111-1111-111111111111', // Employee 1
        priority: 'high',
      }),
    });
    const assignData = await assignRes.json() as any;
    if (assignRes.status === 200) {
      console.log('✓ Ticket assigned successfully!');
      results.assignTicket = true;
    } else {
      console.error('✗ Ticket assignment failed:', assignData);
    }

    // 5. Update status to IN_PROGRESS (Employee 1)
    console.log('\n5. Setting ticket status to in_progress as employee1...');
    const inProgressRes = await fetch(`${BASE_URL}/api/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}`,
      },
      body: JSON.stringify({ status: 'in_progress' }),
    });
    const inProgressData = await inProgressRes.json() as any;
    if (inProgressRes.status === 200) {
      console.log('✓ Status changed to in_progress!');
      results.statusToInProgress = true;
    } else {
      console.error('✗ Status change to in_progress failed:', inProgressData);
    }

    // 6. Update status to RESOLVED (Employee 1)
    console.log('\n6. Setting ticket status to resolved as employee1...');
    const resolvedRes = await fetch(`${BASE_URL}/api/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}`,
      },
      body: JSON.stringify({ status: 'resolved' }),
    });
    const resolvedData = await resolvedRes.json() as any;
    if (resolvedRes.status === 200) {
      console.log('✓ Status changed to resolved!');
      results.statusToResolved = true;
    } else {
      console.error('✗ Status change to resolved failed:', resolvedData);
    }

    // 7. Reopen Ticket (User 1)
    console.log('\n7. Reopening ticket as user1...');
    const reopenRes = await fetch(`${BASE_URL}/api/tickets/${ticketId}/reopen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ reason: 'Vẫn chưa vào được mạng Wifi phòng 405 sau khi reset router!' }),
    });
    const reopenData = await reopenRes.json() as any;
    if (reopenRes.status === 200) {
      console.log('✓ Ticket reopened successfully!');
      results.reopenTicket = true;
    } else {
      console.error('✗ Ticket reopening failed:', reopenData);
    }

    // 8. Close Ticket (Manager)
    console.log('\n8. Closing ticket as manager...');
    const closeRes = await fetch(`${BASE_URL}/api/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`,
      },
      body: JSON.stringify({ status: 'closed' }),
    });
    const closeData = await closeRes.json() as any;
    if (closeRes.status === 200) {
      console.log('✓ Ticket closed successfully!');
      results.closeTicket = true;
    } else {
      console.error('✗ Ticket closing failed:', closeData);
    }

    // 9. Fetch Ticket Details and check logs/comments
    console.log('\n9. Retrieving ticket details to verify timeline log & comments...');
    const detailRes = await fetch(`${BASE_URL}/api/tickets/${ticketId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    const ticketDetail = await detailRes.json() as any;

    if (detailRes.status === 200) {
      console.log('\n--- VERIFICATION OF DB STATES ---');
      console.log(`Ticket Status: ${ticketDetail.status} (Expected: closed)`);
      console.log(`Created At: ${ticketDetail.created_at}`);
      console.log(`Closed At: ${ticketDetail.closed_at}`);
      console.log(`Assignee Name: ${ticketDetail.assignee_name} (Expected: employee1)`);
      console.log(`Attachments Count: ${ticketDetail.attachments?.length || 0} (Expected: 1)`);
      if (ticketDetail.attachments && ticketDetail.attachments.length > 0) {
        console.log(`  Attachment Name: ${ticketDetail.attachments[0].file_name} (Expected: test_log.txt)`);
        console.log(`  Attachment Data: ${ticketDetail.attachments[0].file_data} (Expected: SGVsbG8gV29ybGQh)`);
      }
      
      // Get Timeline
      const timelineRes = await fetch(`${BASE_URL}/api/tickets/${ticketId}/timeline`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${managerToken}` },
      });
      const timeline = await timelineRes.json() as any[];
      console.log('\nTimeline (Logs & Comments):');
      timeline.forEach((item: any) => {
        console.log(`- [${item.type.toUpperCase()}] [${item.user_name} (${item.user_role})]: ${item.content} (${new Date(item.created_at).toLocaleTimeString()})`);
      });

      results.verifyDetail = (
        ticketDetail.status === 'closed' && 
        ticketDetail.attachments?.length === 1 &&
        ticketDetail.attachments[0].file_name === 'test_log.txt' &&
        ticketDetail.attachments[0].file_data === 'SGVsbG8gV29ybGQh' &&
        timeline.some((t: any) => t.type === 'comment' && t.content.includes('Vẫn chưa vào được mạng')) &&
        timeline.some((t: any) => t.type === 'log' && t.content.includes('Mở lại ticket'))
      );
    } else {
      console.error('✗ Fetching ticket detail failed:', ticketDetail);
    }

  } catch (error) {
    console.error('✗ E2E Test aborted due to error:', error);
  }

  console.log('\n=== E2E TESTING RESULTS SUMMARY ===');
  console.table(results);

  const allSucceeded = Object.values(results).every(v => v === true);
  if (allSucceeded) {
    console.log('\n🎉 ALL E2E API VERIFICATIONS PASSED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error('\n🚨 SOME TEST STEPS FAILED. CHECK LOGS ABOVE.');
    process.exit(1);
  }
}

// Ensure the server has time to process (should be running in background)
runTest();
