// Simple test script to verify the extraction API works
async function testExtraction() {
  try {
    console.log('Testing extraction API...');
    
    const response = await fetch('http://localhost:3000/api/extract-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://daringfireball.net/linked/2025/09/06/siegler-cynical-read',
        options: {
          includeImages: true,
          includeLinks: true,
          generateTags: true,
        },
      }),
    });

    if (!response.ok) {
      console.error('API request failed:', response.status, response.statusText);
      return;
    }

    const result = await response.json();
    console.log('API Response:');
    console.log('Success:', result.success);
    console.log('Title:', result.data?.title);
    console.log('Word Count:', result.data?.wordCount);
    console.log('Reading Time:', result.data?.readingTime);
    console.log('Author:', result.data?.author);
    console.log('Site Name:', result.data?.siteName);
    console.log('Excerpt:', result.data?.excerpt?.substring(0, 200) + '...');
    console.log('Tags:', result.data?.tags);
    
    if (result.error) {
      console.error('Error:', result.error);
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testExtraction();
