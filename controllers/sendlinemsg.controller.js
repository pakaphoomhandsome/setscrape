const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sendMsgController = async (msg) => {
    try {
        const sToken = process.env.LINE_TOKEN;
      
        const postData = new URLSearchParams({
            message: msg,
          });
      
        const headers = {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${sToken}`,
        };
      
        const response = await fetch('https://notify-api.line.me/api/notify', {
            method: 'POST',
            headers: headers,
            body: postData,
        });
      
        const result = await response.json();
        console.log(`status: ${result.status}`);
        console.log(`message: ${result.message}`);
          
    } catch (err) {
        console.log('Internal Error 500', err);
    }
}



module.exports = {
    sendMsgController
};
  