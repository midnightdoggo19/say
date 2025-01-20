const { Client, GatewayIntentBits, REST, Routes, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, Events } = require('discord.js');
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
      {
        name: 'channel',
        type: 7,
        description: 'The channel to send in',
        required: false,
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

// client.on('interactionCreate', async interaction => {
//   if (!interaction.isCommand()) return; // only commands
//   if (!process.env.IDs.includes(interaction.user.id)) return;

//   if (interaction.commandName === 'say') {
//     let input = interaction.options.getString('message');
//     let channel = interaction.options.getChannel('channel') || interaction.channel;

//     await interaction.deferReply({ ephemeral: true });
//     await channel.send(input);
//     await interaction.deleteReply();
//   }
// });

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand() && !interaction.isButton()) return;

  // Command to trigger the modal
  if (interaction.isCommand() && interaction.commandName === 'openmodal') {
    // Create the modal
    const modal = new ModalBuilder()
      .setCustomId('exampleModal')
      .setTitle('Example Modal');

    // Create a text input field
    const textInput = new TextInputBuilder()
      .setCustomId('textInput')
      .setLabel('Enter your text:')
      .setStyle(TextInputStyle.Paragraph) // Options: Short or Paragraph
      .setRequired(true);

    // Add the text input to an ActionRow (modals require ActionRows for components)
    const actionRow = new ActionRowBuilder().addComponents(textInput);

    // Add the ActionRow to the modal
    modal.addComponents(actionRow);

    // Show the modal to the user
    await interaction.showModal(modal);
  }

  // Handle modal submission
  if (interaction.isModalSubmit() && interaction.customId === 'exampleModal') {
    const userInput = interaction.fields.getTextInputValue('textInput');
    await interaction.reply(`You entered: ${userInput}`);
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
