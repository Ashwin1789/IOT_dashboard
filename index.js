const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const mysql=require('mysql');
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mqtt=require('mqtt');

const ejs=require('ejs');
require('dotenv').config()



/*****************************************env file accessing********************** */
const db_user = process.env.DB_USER;
const db_password = process.env.DB_PASSWORD;
/*****************MQTT **********************************************************/

app.use(bodyParser.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));


app.get("/", (req, res) => {
  res.render("index");
})

app.get("/setup",(req,res)=>{
  res.render("setup")
})

app.get("/dashboard",(req,res)=>{
  res.render("dashboard")
})

app.get("/success_setup",(req,res)=>{
  res.render("success_setup")
})


const connection=mysql.createConnection({
    host:"localhost",
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
    database:"dashboard"
});


const connection_hivemq=mysql.createConnection({
  host:"localhost",
  user:process.env.DB_USER,
  password:process.env.DB_PASSWORD,
  database:"hivemq"
})

/**********************************************************************MQTT FUNCTION */

app.post("/setup",(req,res)=>{
  const username=req.body.susername;
  const password=req.body.spassword;
  const host=req.body.shost;
  const port=req.body.sport;
  const topic=req.body.stopic;

  connection_hivemq.query("insert into hivemq_credentials (username,password,host,port,topic) values (?,?,?,?,?)",[username,password,host,port,topic],function(error,results){
    if(results.length>0){
      res.render("success_setup.ejs")
    }
    else{
      res.render("setup")
    }
  })
  const options={
    host: this.host,
    port: this.port,
    protocol: 'mqtts',
    username: this.username,
    password: this.password
  }
  var client=mqtt.connect(options)
  client.on('connect',()=>{
    client.subscribe(this.topic);
  })
  client.on('message',(topic,message)=>{
    console.log("received message:",message.toString());
  })
})

//login code ---------------------------------------------------------------------------------------------------

app.post("/login", (req, res) => {
  const { name, password } = req.body;

  connection.query("select * from persons where email=? and password=?",[name,password],function(error,results,field){

    if(results.length >= 0)
        res.render("dashboard",{
            username: name,
        });
        else{
            res.render("./");
        }
  })
});

// register code ------------------------------------------------------------------------------------------

app.post("/regin",function(req,res){

    var name=req.body.getname;
    var password=req.body.getpassword;
    connection.query("INSERT INTO persons (email,password) VALUES (?,?)",[name,password],function(error,results,field){
      if(results===true)
      res.render("content",(req,res)=>{
          req.flash('success','Successfully Registerd');
      });
      else{
        res.render("./");
      }
    })
  

});
// *************************************************************************************************
http.listen(4000, () => {
  console.log("server started");
})