require('dotenv').config();

const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

async function getInstagramAccountId() {
    try {
        console.log('Testing access token...');
        console.log('Token:', ACCESS_TOKEN.substring(0, 20) + '...');

        // First, get the Facebook Page ID
        const meResponse = await fetch(
            `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${ACCESS_TOKEN}`
        );
        const meData = await meResponse.json();

        if (meData.error) {
            console.error('Error getting user info:', meData.error);
            return;
        }

        console.log('\n✅ Token is valid!');
        console.log('User/Page:', meData.name);
        console.log('ID:', meData.id);

        // This is already a Page Access Token, so check directly for Instagram account
        console.log('\nChecking for Instagram Business Account...');
        const igResponse = await fetch(
            `https://graph.facebook.com/v18.0/${meData.id}?fields=instagram_business_account&access_token=${ACCESS_TOKEN}`
        );
        const igData = await igResponse.json();

        if (igData.error) {
            console.error('\n❌ Error getting Instagram account:', igData.error);
            console.log('\nPossible solutions:');
            console.log('1. Make sure your Facebook Page is linked to an Instagram Business account');
            console.log('2. Add instagram_basic and instagram_content_publish permissions');
            console.log('3. Regenerate your Page Access Token with the correct permissions');
            return;
        }

        if (igData.instagram_business_account) {
            const accountId = igData.instagram_business_account.id;
            console.log('\n✅ Instagram Business Account found!');
            console.log('Account ID:', accountId);
            console.log('\nYour current .env configuration:');
            console.log(`INSTAGRAM_ACCOUNT_ID=${accountId}`);
            console.log(`INSTAGRAM_ACCESS_TOKEN=${ACCESS_TOKEN.substring(0, 20)}...`);

            // Verify the account ID matches
            if (accountId === process.env.INSTAGRAM_ACCOUNT_ID) {
                console.log('\n✅ Account ID matches your .env file!');
            } else {
                console.log('\n⚠️  Account ID does NOT match your .env file!');
                console.log('Update your .env file with:');
                console.log(`INSTAGRAM_ACCOUNT_ID=${accountId}`);
            }
            return accountId;
        } else {
            console.log('\n⚠️  No Instagram Business Account found');
            console.log('Make sure:');
            console.log('1. Your Instagram account is a Business or Creator account');
            console.log('2. It is linked to this Facebook Page');
            console.log('3. Go to: https://www.facebook.com/settings?tab=business_tools');
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

getInstagramAccountId();
