import SparkPost from 'sparkpost';

// Test the actual SparkPost API connection
async function testSparkPost() {
  console.log('Testing SparkPost API connection...');
  
  const apiKey = process.env.SPARKPOST_API_KEY;
  if (!apiKey) {
    console.error('❌ SPARKPOST_API_KEY not found');
    return;
  }
  
  console.log('✓ API Key found:', apiKey.substring(0, 10) + '...');
  
  try {
    const sparkpost = new SparkPost(apiKey);
    
    // Test 1: Check account info
    console.log('Testing account access...');
    const account = await sparkpost.account.get();
    console.log('✓ Account accessible:', account);
    
    // Test 2: Check sending domains
    console.log('Testing sending domains...');
    const domains = await sparkpost.sendingDomains.list();
    console.log('✓ Sending domains:', domains);
    
    // Test 3: Send a real test email
    console.log('Sending test email...');
    const result = await sparkpost.transmissions.send({
      content: {
        from: 'noreply@send.rcrc.ca',
        subject: 'SparkPost API Test',
        text: 'This is a test email to verify API connection',
        html: '<p>This is a test email to verify API connection</p>'
      },
      recipients: [{ address: 'aabojedi@banacenter.com' }]
    });
    
    console.log('✓ Test email sent:', result);
    
  } catch (error) {
    console.error('❌ SparkPost API Error:', error.message);
    console.error('Error details:', error);
  }
}

testSparkPost();