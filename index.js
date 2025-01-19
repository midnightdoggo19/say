const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config(); // For environment variables

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// slash command
const commands = [
  {
    name: 'say', // command name
    description: 'Have the bot say something!',
    options: [
      {
        name: 'message',
        type: 3, // STRING
        description: 'The message to say', // for the field
        required: true,
      },
    ],
  },
];

(async () => {
  try {
    console.log('Registering slash commands...'); // global
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('Slash commands registered!');
  } catch (err) {
    console.error('Error registering slash commands:', err);
  }
})();

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return; // only commands

    if (interaction.commandName === 'say') {
    const input = interaction.options.getString('message');

    // Acknowledge the interaction to avoid a timeout
    await interaction.deferReply({ ephemeral: true });

    // Send a standalone message to the channel
    await interaction.channel.send(input);

    // Optionally, delete the ephemeral deferred reply
    await interaction.deleteReply();
  }
});

client.login(process.env.TOKEN).then(() => {
  console.log('Discord bot is online!');
}).catch(err => {
  console.error('Error logging into Discord:', err);
});

process.on('SIGINT', function() {
    console.log("\nCaught interrupt signal, shutting down!");
    process.exit();
});

