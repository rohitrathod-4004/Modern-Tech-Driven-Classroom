import axios from 'axios';

const run = async () => {
  try {
    const res = await axios.post('http://localhost:3001/api/admin/lectures/6a0f8929885196ea9ae8a0b4/reprocess-ai', {}, {
      headers: {
        Cookie: 'refreshToken=c69066ba5d536043ee587fad068d826d5036485b5fdcd0c6abdaf0099ede61525ace14d2bedeed48',
        Authorization: 'Bearer <YOUR_ACCESS_TOKEN>' // wait, I don't have the access token!
      }
    });
    console.log("Success", res.data);
  } catch (err: any) {
    console.error(err.response?.status, err.response?.data);
  }
};

run();
