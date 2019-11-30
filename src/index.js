const express = require('express');
require('./db/mongoose'); // load the database
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

const app = express();
const port = process.env.PORT;

// automatically parse incoming json to an object to access in request handlers
app.use(express.json());

// routing
app.use(userRouter);
app.use(taskRouter);

app.listen(port, () => {
    console.log(`Server is up on ${port}.`)
});
