var express = require('express')
var app = express()
const bodyParser = require('body-parser');
var path = require('path');
const axios = require('axios');
const qs = require('querystring')
var nodemailer = require('nodemailer');
var cors = require('cors')
const fs = require('fs');
require('dotenv').config()
var port = process.env.PORT || 4000;

var omise = require('omise')({
	'publicKey': process.env.OMISE_PUBLIC_KEY,
	'secretKey': process.env.OMISE_SECRET_KEY,
});

var server = app.listen(port,function(){
	console.log('Server running on port '+port)
})

app.use(cors());
app.use(express.static(__dirname + '/'));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({'extended':true}))

app.get('/',function(req,res){
	res.sendFile(path.join(__dirname+'/index.html'))
})

app.get('/test',function(req,res){
	res.send("Test");
})

/*
const createBanking = async ()=>{
	try{
		const res = await omise.charges.create({
			amount: 10700,
			source: 'src_test_5i5ayk38ajh9594zclo',
			currency: 'thb',
			return_uri: 'https://omise.co'
		});
		console.log(res)
		if(res){
			res.send({
				amount: res.amount,
				status: res.status
			})
		}
	}catch(error){
		console.log(error)
		//res.send(error)
	}
}

createBanking();
*/

app.get('/testmail', async (req,res)=>{
	
	var transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: 'klineneverdie@gmail.com',
			pass: 'xxx' /* password from google App Password*/
		}
	});

	var mailOptions = {
		from: 'klineneverdie@gmail.com',
		to: 'joystats@yahoo.com,p44n@hotmail.com',
		subject: 'Sending Email using Node.js',
		html: '<h1>Notice</h1><p>That was easy!</p>'
	};
	
	transporter.sendMail(mailOptions, function(error, info){
		if (error) {
			console.log(error);
		} else {
			console.log('Email sent: ' + info.response);
		}
	});
	
	res.json({a:1})
	
})

/*
const aa= async ()=>{
	requestBody={
		message:"test"
	}
	try{
		const line= await axios({
			method: 'post',
			url: 'https://notify-api.line.me/api/notify',
			data:qs.stringify(requestBody),
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				"Authorization": "Bearer KcO1cAA1unj8F4tRTl34RMa7BegDq3ZwqZv6T4P1UMf"
			}
		})
		console.log(line.status)
	}catch(error){
		console.log(error)
	}
}
aa();*/

const sendNotify = async (message)=>{
	const requestBody = {
		message
	}
	return await axios({
		method: 'post',
		url: 'https://notify-api.line.me/api/notify',
		data:qs.stringify(requestBody),
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			"Authorization": "Bearer KcO1cAA1unj8F4tRTl34RMa7BegDq3ZwqZv6T4P1UMf"
		}
	})
}


app.post('/getcharge/:id', (req,res)=>{
	const {id} = req.params
	try{
		//omise.charges.retrieve('https://api.omise.co/charges/'+id);
		omise.charges.retrieve(id,function(error, charge) {
			if(charge.status==="successful"){
				console.log(charge)
				sendNotify("มียอดชำระเงินผ่านอินเตอร์เน็ตแบ็งค์กิ้งจำนวน "+(charge.amount/100).toFixed(2)+" THB")
			}
			res.send(charge)
		});
	}catch(error){
		console.log(error)
	}
})

app.post('/omisewebhook', async (req,res)=>{
	const jsonContent = JSON.stringify(req.body);
	fs.writeFile("output.json", jsonContent, 'utf8', function (err) {
		if (err) {
			console.log("An error occured while writing JSON Object to File.");
			return console.log(err);
		}
	 
		console.log("omise was hook.");
	});
	res.json(req.body)
})

app.post('/checkout-internet-banking', async (req,res)=>{
	const {name, email, amount, token} = req.body
	const random = Math.floor(Math.random() * 1000) + 1
	try{
		const charge = await omise.charges.create({
			amount: amount,
			source: token,
			currency: 'thb',
			return_uri: 'https://reactshop-18352.firebaseapp.com/#/finished/'+random
			//return_uri: 'http://localhost:3000/#/finished/'+random
		});
		
		if(charge){
			console.log('charge-->',charge)
			await sendNotify("มีคำสั่งซื้อใหม่เลขที่: ORD"+random)
			res.send({
				id: charge.id,
				random_id: random,
				amount: charge.amount,
				status: charge.status,
				authorizeUri: charge.authorize_uri
			})
		}
	}catch(error){
		res.send(error)
	}
	
})

app.post('/checkout-credit-card', async (req,res)=>{
	const {name, email, amount, token} = req.body
	try{
		const customer = await omise.customers.create({
			email: email,
			description: name,
			card: token,
		});
		  
		const charge = await omise.charges.create({
			amount: amount,
			currency: 'thb',
			customer: customer.id,
		});
		if(charge){
			await sendNotify("มียอดชำระเงินผ่านบัตรเครดิตจำนวน "+(amount/100).toFixed(2)+" THB")
			res.send({
				amount: charge.amount,
				status: charge.status
			})
		}
	}catch(error){
		res.send(error)
	}
	
})


