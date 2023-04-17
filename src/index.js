const express = require('express')
const app = express();
const port = 3000

app.get('/', (req, res) => res.send('Yo boi!!'))

app.listen(port, () =>
console.log(`Your app is listening a http://localhost:${port}`)
);

require('dotenv/config');
const { Client, Partials, GatewayIntentBits } = require('discord.js');

const {Configuration , OpenAIApi}=require('openai');
const keep_alive = require('./keepalive.js');
const mySecret = process.env['DISCORD_BOT_SECRET']
// const fetch = require('node-fetch');
const client = new Client({

  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel],
});



const openai = new OpenAIApi(new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
);


const PREFIX = "$";
client.on('ready', () => {
  console.log(`${client.user.tag} has logged in`);
});


function getQuote() {
  return fetch("https://zenquotes.io/api/random")
    .then(res => {
      return res.json()
      })
    .then(data => {
      return data[0]["q"] + " -" + data[0]["a"]
    })
}


const sadWords = ["sad", "depressed", "unhappy", "angry", "miserable"]
const encouragements = [
  "Cheer up!",
  "Hang in there.",
  "You are a great person / bot!"
]


client.on('messageCreate', async (message) => {
  console.log({ message })
  if (message.author.bot) return;
  else if(message.content.startsWith('#'))
  {
    try {
    const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
            {role: "system", content: "You are a helpful assistant who responds succinctly"},
            {role: "user", content: message.content}
        ],
      });

    const content = response.data.choices[0].message;
    return message.reply(content);

  } catch (err) {
    return message.reply(
      "As an AI robot, I errored out."
    );
  }
  }
    
  else{
  if (message.content.startsWith(PREFIX)) {
    const [CMD_NAME, ...args] = message.content.trim().substring(PREFIX.length).split(/\s+/);
   
    if (CMD_NAME === 'kick') {
      console.log("kick")
      if (!message.member.permissions.has('KICK_MEMBERS'))
        return message.reply('You do not have permission to use that command');
      if (args.length === 0) return message.reply('Please provide an ID');
      const member = message.guild.members.cache.get(args[0]);
      if (member) {
        member.kick().then(member => message.channel.send(`${member} is kicked.`))
          .catch((err) => message.channel.send('I do not have permission to kick that user :('));
      } else {
        message.channel.send('That member was not found');
      }
    } 
    else if(CMD_NAME ==='quiz'){
      const response= await fetch('https://opentdb.com/api.php?amount=1&type=boolean');
      const data =await response.json();
      var length= data.results.length;
      var randomNumber = Math.floor(Math.random()*length);
      var randomQuestion= data.results[randomNumber];
      var question= randomQuestion.question;
      var correctAnswer= randomQuestion.correct_answer;
      message.channel.send(question);

      const filter= m=> m.author.id === message.author.id; 
      const answer = await message.channel.awaitMessages (filter,{maxMatches: 1, time:10000, errors:['time','maxMatches']});

       const ans= answer.first();
       if(ans.content.toLowerCase()===correctAnswer.toLowerCase())
{ message.channel.send("You got the question right.");
}
else { message.channel.send("That is incorrect.");

}}

    else if (CMD_NAME === 'inspire') {
      getQuote().then(quote => message.channel.send(quote));
    }
    
    else if (CMD_NAME === 'ban') {
      if (!message.member.hasPermission('BAN_MEMBERS'))
        return message.reply('You do not have permission to use that command');
      if (args.length === 0) return message.reply('Please provide an ID');
      try {
        const user = await message.guild.members.ban(args[0]);
        message.channel.send('User banned succesfully');
        console.log(user);
      } catch (err) {
        console.log(err);
        message.channel.send('An error occured');
      }

    } 
  
  }
  
  else if (sadWords.some(word => message.content.includes(word))) {
    const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)]
    message.reply(encouragement)
  }
  }
  
});

client.login(mySecret);