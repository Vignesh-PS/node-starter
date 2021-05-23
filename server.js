const http = require('http');

const todos = [
    { id: 1, text: 'Todo 1' },
    { id: 2, text: 'Todo 2' },
    { id: 3, text: 'Todo 3' },
    { id: 4, text: 'Todo 4' },
];


const server = http.createServer((req, res) => {

    const {method, url} = req;

    let body = [];

    req.on('data', chunk => {
        body.push(chunk);
    }).on('end', () => {
        body = Buffer.concat(body).toString();

        let status = 404;
        const response = {success: false, data: null, error: null};

        if(method=='GET' && url=='/todos'){
            status = 200;
            response.success = true;
            response.data = todos;  
        }else if(method=='POST' && url=='/todos'){
            const {id, text} = JSON.parse(body);

            if(!id || !text){
                status=400;
                response.error = 'Field is missing';
            }else{   
                status=201;
                todos.push({id, text});
                response.success = true;
                response.data = todos;
            }
        }
        
        res.writeHead(status, {
            'Content-Type': 'application/json',
            'X-Powered-By': 'Node JS'
        })
        
        res.end(JSON.stringify(response));
    })
});

const PORT = 5000;

server.listen(PORT, () => console.log('Server listening on port ' + PORT))