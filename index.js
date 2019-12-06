var express = require('express')
var app = express()
const bodyParser = require('body-parser');
var path = require('path');
var cors = require('cors')
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
			source: 'src_test_5i40xf140otk3m5wvn',
			currency: 'thb',
			return_uri: 'https://omise.co'
		});
		if(res){
			res.send({
				amount: res.amount,
				status: res.status
			})
		}
	}catch(error){
		res.send(error)
	}
}

createBanking();*/


app.post('/checkout-internet-banking', async (req,res)=>{
	const {name, email, amount, token} = req.body
	try{
		const charge = await omise.charges.create({
			amount: amount,
			source: token,
			currency: 'thb',
			return_uri: 'http://localhost:3000/cart'
		});
		if(charge){
			res.send({
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
			res.send({
				amount: charge.amount,
				status: charge.status
			})
		}
	}catch(error){
		res.send(error)
	}
	
})


