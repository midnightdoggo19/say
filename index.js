const { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder, 
    Events 
} = require('discord.js');

require('dotenv').config();
const winston = require('winston');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent] });
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

const logger = winston.createLogger({
  level: process.env.LOGLEVEL || 'info',
  format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(info => `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`)
  ),
  transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: process.env.LOG || process.env.LOGFILE || 'logger.log' }),
  ]
});

const commands = [
    {
        name: 'send',
        description: 'Announce to a channel',
    },
    {
        name: 'channel',
        description: 'Print the current channel ID',
    },
];

(async () => {
try {
    console.log('Registering slash commands...');
    await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
    );
    console.log('Slash commands registered!');
} catch (err) {
    console.error('Error registering slash commands:', err);
}})();

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand() && !interaction.isModalSubmit()) return;
  if (interaction.commandName === 'channel') {interaction.reply({ content: interaction.channelId, flags: 64 });}; // handle channel command
  if (!process.env.IDs.includes(interaction.user.id)) { logger.warn(`Unauthorized user ${interaction.user.username} attempted to use a command.`); return; } // limit to defined users

  if (interaction.isCommand() && interaction.commandName === 'send') {
      logger.debug(`${interaction.username} ran the \`send\` command`)      

        const modal = new ModalBuilder()
            .setCustomId('messageModal')
            .setTitle('Send a message to a channel');

        // channel to send to
        const channelInput = new TextInputBuilder()
            .setCustomId('channelInput')
            .setLabel('Enter the Channel ID:')
            .setStyle(TextInputStyle.Short) // one line
            .setRequired(false);

        // message
        const messageInput = new TextInputBuilder()
            .setCustomId('messageInput')
            .setLabel('Enter the Message:')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        // add inputs to actionrows
        const channelRow = new ActionRowBuilder().addComponents(channelInput);
        const messageRow = new ActionRowBuilder().addComponents(messageInput);

        // add rows to the modal
        modal.addComponents(channelRow, messageRow);

        await interaction.showModal(modal);
  }

  // modal submission
  if (interaction.isModalSubmit() && interaction.customId === 'messageModal') {
    const channelId = interaction.fields.getTextInputValue('channelInput') || interaction.channelId;
    const message = interaction.fields.getTextInputValue('messageInput');

    if (isNaN(channelId)) {
        return interaction.reply({
            content: 'Channel ID must be a valid number.',
            flags: 64,
        });
    }

    const channel = await client.channels.fetch(channelId).catch(err => {
        logger.error(`Failed to fetch channel ${channelId}: ${err.message}`);
        return null;
    });

    if (!channel || !channel.isTextBased()) {
        logger.debug(`${interaction.username} attempted to use an invalid channel ID`)

        return interaction.reply({
        content: 'Invalid channel ID or the channel is not text-based.',
        flags: 64,
    });
    }

    // send to channel
    await channel.send(message);
    await interaction.reply({
        content: `Message successfully sent to <#${channelId}>.`,
        flags: 64,
    });

    logger.info(`${interaction.username} sent message "${message}" to ${channelId}`)
}
});

if (!process.env.TOKEN || !process.env.CLIENT_ID) {
  logger.error('Missing TOKEN or CLIENT_ID in the environment variables.');
  process.exit(1);
}

client.login(process.env.TOKEN).then(() => {
    logger.info('Discord bot is online!');
}).catch(err => {
    logger.error('Error logging into Discord:', err);
});

process.on('SIGINT', function() {
    logger.info("Caught interrupt signal, shutting down!");
    process.exit();
});
