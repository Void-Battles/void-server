var { Client } = require('pg')
const client = new Client({ connectionString: 'postgres://gpspagsoacswgw:3d394f39d802306192923a07a168928658d4dab713f75d2b30a33897597e8874@ec2-23-21-236-249.compute-1.amazonaws.com:5432/df7e37aantqni4?ssl=true' })

try {
    client.connect((error, client, done) => {
    if (error) console.log(('Failed to connect to database...' + error))
    else console.log('Connected to database!')
    })
} catch (err) {
    console.log('Failed to Connect to Database: ', err)
}


module.exports = {
    client
}