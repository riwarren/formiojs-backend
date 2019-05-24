# formiojs-backend
Form.io JS library re-written for backend node.js use

# Usage

npm install

npm start

```
let formio = new Formio('https://api.example.com');
formio.loadSubmissions('user', { 'data.username': 'demo' }).then((submissions) => {
  console.log(submissions);
  formio.saveSubmission('user', submissions[0], submissions[0]._id).then((submission) => {
    console.log(submission);
  });
});
```
