import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';

const INPUT_CHANNEL_ID = '1509184085015269516'; // #result-commands channel
const OUTPUT_CHANNEL_ID = '1500797205382959164'; // Output channel for the embed result

// Rank choices ordered from highest (HT1) to lowest (LT5)
const RANK_CHOICES = [
    { name: 'HT1', value: 'HT1' },
    { name: 'LT1', value: 'LT1' },
    { name: 'HT2', value: 'HT2' },
    { name: 'LT2', value: 'LT2' },
    { name: 'HT3', value: 'HT3' },
    { name: 'LT3', value: 'LT3' },
    { name: 'HT4', value: 'HT4' },
    { name: 'LT4', value: 'LT4' },
    { name: 'HT5', value: 'HT5' },
    { name: 'LT5', value: 'LT5' },
    { name: 'N/A', value: 'N/A' },
];

// MCTiers Point System
const TIER_POINTS = {
    'HT1': 60,
    'LT1': 45,
    'HT2': 30,
    'LT2': 20,
    'HT3': 10,
    'LT3': 5,
    'HT4': 4,
    'LT4': 3,
    'HT5': 2,
    'LT5': 1,
    'N/A': 0
};

// Gamemode Mapping to Supabase IDs
const GAMEMODE_MAPPING = {
    'Sword': 'sword',
    'Axe': 'axe',
    'Vanilla': 'vanilla',
    'SMP': 'smp',
    'Diamond SMP': 'diasmp',
    'Pot': 'pot',
    'UHC': 'uhc',
    'Netherite OP': 'nethop',
    'Cart': 'cart',
    'Spear Mace': 'spearmace'
};

// =========================================================
// 📌 DISCORD ROLE IDS MAPPING (HT1 -> LT5)
// Format Key: "GAMEMODE_TIER"
// =========================================================
const ROLE_IDS = {
    // 1. Sword
    'Sword_HT1': '1500753800930000968',
    'Sword_LT1': '1500752952250466425',
    'Sword_HT2': '1500753802599338016',
    'Sword_LT2': '1500752952879616011',
    'Sword_HT3': '1500753805070045254',
    'Sword_LT3': '1500752953424871475',
    'Sword_HT4': '1500753807620046878',
    'Sword_LT4': '1500752954758664193',
    'Sword_HT5': '1500753809662804049',
    'Sword_LT5': '1500753017534939199',

    // 2. Axe
    'Axe_HT1': '1502310374140022994',
    'Axe_LT1': '1502310389222871140',
    'Axe_HT2': '1502310377978069012',
    'Axe_LT2': '1502310388589396059',
    'Axe_HT3': '1502310382113652929',
    'Axe_LT3': '1502310387465322576',
    'Axe_HT4': '1502310384797876425',
    'Axe_LT4': '1502310386907615252',
    'Axe_HT5': '1502310386072944751',
    'Axe_LT5': '1502310386274275498',

    // 3. Vanilla / Crystal
    'Vanilla_HT1': '1500746475448176793',
    'Vanilla_LT1': '1500746484767789096',
    'Vanilla_HT2': '1500746481043247224',
    'Vanilla_LT2': '1500746485455781888',
    'Vanilla_HT3': '1500746481609474169',
    'Vanilla_LT3': '1500746486164623551',
    'Vanilla_HT4': '1500746482498801714',
    'Vanilla_LT4': '1500746486567145514',
    'Vanilla_HT5': '1500746483845173308',
    'Vanilla_LT5': '1500746487368384572',

    // 4. SMP
    'SMP_HT1': '1502540937367257109',
    'SMP_LT1': '1502540933768679485',
    'SMP_HT2': '1502540938306781264',
    'SMP_LT2': '1502540934246568066',
    'SMP_HT3': '1502540939133190306',
    'SMP_LT3': '1502540934968250448',
    'SMP_HT4': '1502540940555059200',
    'SMP_LT4': '1502540935819563178',
    'SMP_HT5': '1502540941582667786',
    'SMP_LT5': '1502540936385794179',

    // 5. Diamond SMP
    'Diamond SMP_HT1': '1500755032478322759',
    'Diamond SMP_LT1': '1500479159468822558',
    'Diamond SMP_HT2': '1500755019715313756',
    'Diamond SMP_LT2': '1500479159456235539',
    'Diamond SMP_HT3': '1500755021904744478',
    'Diamond SMP_LT3': '1500480067242033323',
    'Diamond SMP_HT4': '1500755024874180628',
    'Diamond SMP_LT4': '1500479978884825349',
    'Diamond SMP_HT5': '1500755027587764325',
    'Diamond SMP_LT5': '1500480104046919711',

    // 6. Pot
    'Pot_HT1': '1502312007460847616',
    'Pot_LT1': '1502311997591781516',
    'Pot_HT2': '1502312008580858088',
    'Pot_LT2': '1502312002775941332',
    'Pot_HT3': '1502540229528125483',
    'Pot_LT3': '1502312005359505510',
    'Pot_HT4': '1502540233898463302',
    'Pot_LT4': '1502312005883793489',
    'Pot_HT5': '1502540238587953252',
    'Pot_LT5': '1502312006458540162',

    // 7. UHC
    'UHC_HT1': '1502310022292574448',
    'UHC_LT1': '1500756920976281770',
    'UHC_HT2': '1502310028265132223',
    'UHC_LT2': '1500756921769267271',
    'UHC_HT3': '1502310031603925105',
    'UHC_LT3': '1500756922335498251',
    'UHC_HT4': '1502310035294785728',
    'UHC_LT4': '1500756923174355035',
    'UHC_HT5': '1502310139074576446',
    'UHC_LT5': '1500756923627208704',

    // 8. Netherite OP
    'Netherite OP_HT1': '1500756916358479933',
    'Netherite OP_LT1': '1500746484327383120',
    'Netherite OP_HT2': '1500756917121847430',
    'Netherite OP_LT2': '1500756912310976522',
    'Netherite OP_HT3': '1500756917843394690',
    'Netherite OP_LT3': '1500756908741759036',
    'Netherite OP_HT4': '1500756918594179102',
    'Netherite OP_LT4': '1500756915129421946',
    'Netherite OP_HT5': '1500756919428841532',
    'Netherite OP_LT5': '1500756915959889970',

    // 9. Cart
    'Cart_HT1': '1507231753352253440',
    'Cart_LT1': '1507231761698918560',
    'Cart_HT2': '1507231757965983844',
    'Cart_LT2': '1507231762512744589',
    'Cart_HT3': '1507231759341846619',
    'Cart_LT3': '1507231763175444480',
    'Cart_HT4': '1507231760038101162',
    'Cart_LT4': '1507231763615846493',
    'Cart_HT5': '1507231760809726133',
    'Cart_LT5': '1507231904242598038',

    // 10. Spear Mace
    'Spear Mace_HT1': '1507226546350592110',
    'Spear Mace_LT1': '1507226563777663138',
    'Spear Mace_HT2': '1507226550548959282',
    'Spear Mace_LT2': '1507226566529257553',
    'Spear Mace_HT3': '1507226553736495194',
    'Spear Mace_LT3': '1507226567703658597',
    'Spear Mace_HT4': '1507226556798341160',
    'Spear Mace_LT4': '1507226568076824619',
    'Spear Mace_HT5': '1546382650355220530',
    'Spear Mace_LT5': '1507226568857227395'
};

export default {
    category: 'Tiers',
    data: new SlashCommandBuilder()
        .setName('testresult')
        .setDescription('Submit a player tier testing result')
        .addUserOption(option => 
            option.setName('player')
                .setDescription('The player who was tested')
                .setRequired(true))
        .addUserOption(option => 
            option.setName('tester')
                .setDescription('The tester who conducted the test')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('region')
                .setDescription('Player region')
                .setRequired(true)
                .addChoices(
                    { name: 'North America (NA)', value: 'NA' },
                    { name: 'Europe (EU)', value: 'EU' },
                    { name: 'Asia (AS)', value: 'AS' },
                    { name: 'Australia (AU)', value: 'AU' },
                    { name: 'South America (SA)', value: 'SA' }
                ))
        .addStringOption(option => 
            option.setName('username')
                .setDescription('Minecraft IGN / Username')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('gamemode')
                .setDescription('Gamemode tested')
                .setRequired(true)
                .addChoices(
                    { name: 'Sword', value: 'Sword' },
                    { name: 'Axe', value: 'Axe' },
                    { name: 'Vanilla', value: 'Vanilla' },
                    { name: 'SMP', value: 'SMP' },
                    { name: 'Diamond SMP', value: 'Diamond SMP' },
                    { name: 'Pot', value: 'Pot' },
                    { name: 'UHC', value: 'UHC' },
                    { name: 'Netherite OP', value: 'Netherite OP' },
                    { name: 'Cart', value: 'Cart' },
                    { name: 'Spear Mace', value: 'Spear Mace' }
                ))
        .addStringOption(option => 
            option.setName('previous_rank')
                .setDescription('Previous rank of the player')
                .setRequired(true)
                .addChoices(...RANK_CHOICES))
        .addStringOption(option => 
            option.setName('rank_earned')
                .setDescription('New rank earned')
                .setRequired(true)
                .addChoices(...RANK_CHOICES)),

    async execute(interaction, client, supabase) {
        if (interaction.channelId !== INPUT_CHANNEL_ID) {
            return await interaction.reply({
                content: `❌ This command can only be used in <#${INPUT_CHANNEL_ID}>!`,
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const player = interaction.options.getUser('player');
        const tester = interaction.options.getUser('tester');
        const region = interaction.options.getString('region');
        const username = interaction.options.getString('username');
        const gamemode = interaction.options.getString('gamemode');
        const previousRank = interaction.options.getString('previous_rank');
        const rankEarned = interaction.options.getString('rank_earned');

        // 1. DISCORD ROLE MANAGEMENT (Remove existing gamemode roles & Assign new role)
        let roleAddedStatus = '';
        if (interaction.guild && player) {
            try {
                const member = await interaction.guild.members.fetch(player.id).catch(() => null);
                if (member) {
                    let removedRoles = [];
                    
                    const gamemodeRoleIds = Object.keys(ROLE_IDS)
                        .filter(key => key.startsWith(`${gamemode}_`))
                        .map(key => ROLE_IDS[key]);

                    for (const roleId of gamemodeRoleIds) {
                        if (member.roles.cache.has(roleId)) {
                            const r = interaction.guild.roles.cache.get(roleId);
                            await member.roles.remove(roleId).catch(() => null);
                            if (r) removedRoles.push(r.name);
                        }
                    }

                    if (rankEarned !== 'N/A') {
                        const targetRoleId = ROLE_IDS[`${gamemode}_${rankEarned}`];
                        if (targetRoleId) {
                            const targetRole = interaction.guild.roles.cache.get(targetRoleId);
                            if (targetRole) {
                                await member.roles.add(targetRole);
                                roleAddedStatus = `\n🎖️ Role **${targetRole.name}** assigned successfully!`;
                                if (removedRoles.length > 0) {
                                    roleAddedStatus += ` (Removed old roles: **${removedRoles.join(', ')}**)`;
                                }
                            } else {
                                roleAddedStatus = `\n⚠️ Role ID exists, but the role was not found in the guild!`;
                            }
                        } else {
                            roleAddedStatus = `\n⚠️ Role ID for **${gamemode} ${rankEarned}** is not registered!`;
                        }
                    } else {
                        roleAddedStatus = `\nℹ️ Rank set to N/A${removedRoles.length > 0 ? ` (Removed: **${removedRoles.join(', ')}**)` : ''}.`;
                    }
                }
            } catch (roleErr) {
                console.error('❌ Error updating roles:', roleErr);
                roleAddedStatus = `\n❌ Failed to update roles (Ensure bot hierarchy is higher than tier roles).`;
            }
        }

        // 2. SUPABASE INTEGRATION & RECALCULATE POINTS
        // Menggunakan instance 'supabase' langsung atau fallback ke 'client.supabase'
        const db = supabase || client?.supabase;

        if (db && typeof db.from === 'function') {
            try {
                const { data: playerData, error: playerErr } = await db
                    .from('players')
                    .upsert([
                        {
                            discord_id: player.id,
                            ign: username,
                            region: region,
                            type: 'Java'
                        }
                    ], { onConflict: 'ign' })
                    .select('id')
                    .single();

                if (playerErr) {
                    console.error('❌ Error saving to players table:', playerErr);
                } else if (playerData) {
                    const playerId = playerData.id;
                    const mappedGamemodeId = GAMEMODE_MAPPING[gamemode] || gamemode.toLowerCase();

                    const { error: tierErr } = await db
                        .from('player_tiers')
                        .upsert([
                            {
                                player_id: playerId,
                                gamemode_id: mappedGamemodeId,
                                tier: rankEarned,
                                updated_at: new Date().toISOString()
                            }
                        ], { onConflict: 'player_id,gamemode_id' });

                    if (tierErr) {
                        console.error('❌ Error saving to player_tiers table:', tierErr);
                    } else {
                        const { data: allTiers, error: fetchTiersErr } = await db
                            .from('player_tiers')
                            .select('tier')
                            .eq('player_id', playerId);

                        if (!fetchTiersErr && allTiers) {
                            const totalPoints = allTiers.reduce((sum, item) => sum + (TIER_POINTS[item.tier] || 0), 0);

                            const { error: updatePointErr } = await db
                                .from('players')
                                .update({ points: totalPoints })
                                .eq('id', playerId);

                            if (updatePointErr && updatePointErr.code === 'PGRST204') {
                                await db
                                    .from('players')
                                    .update({ point: totalPoints })
                                    .eq('id', playerId);
                            }
                        }
                    }
                }
            } catch (dbErr) {
                console.error('❌ Database Exception:', dbErr);
            }
        } else {
            console.warn('⚠️ Instance Supabase tidak ditemukan atau tidak terhubung.');
        }

        // 3. BUILD EMBED (HollowTiers Style)
        const minecraftHeadUrl = `https://mc-heads.net/avatar/${username}/512`;

        // Safe avatar check menggunakan optional chaining (?.)
        const playerAvatar = player?.displayAvatarURL?.({ extension: 'png', size: 256 }) 
            || player?.avatarURL 
            || 'https://cdn.discordapp.com/embed/avatars/0.png';

        const botAvatar = client?.user?.displayAvatarURL?.({ extension: 'png', size: 256 }) 
            || client?.user?.avatarURL 
            || 'https://cdn.discordapp.com/embed/avatars/0.png';

        const embed = new EmbedBuilder()
            .setAuthor({ 
                name: `${username}'s Tier Test Result`, 
                iconURL: playerAvatar 
            })
            .setColor('#2b2d31')
            .setThumbnail(minecraftHeadUrl)
            .addFields(
                { name: '👤 Tested Player', value: `<@${player.id}> (\`${username}\`)`, inline: true },
                { name: '⚔️ Tester', value: `<@${tester.id}>`, inline: true },
                { name: '🌐 Region', value: `\`${region}\``, inline: true },
                { name: '🎮 Gamemode', value: `\`${gamemode}\``, inline: true },
                { name: '📊 Previous Rank', value: `\`${previousRank}\``, inline: true },
                { name: '🏆 Rank Earned', value: `\`${rankEarned}\``, inline: true }
            )
            .setFooter({ text: 'HollowTiers • Tier Test System', iconURL: botAvatar })
            .setTimestamp();

        // 4. SEND TO OUTPUT CHANNEL
        try {
            const outputChannel = await client.channels.fetch(OUTPUT_CHANNEL_ID);
            if (outputChannel && outputChannel.isTextBased()) {
                await outputChannel.send({
                    content: `<@${player.id}> [${region}]`,
                    embeds: [embed]
                });
            } else {
                console.error('❌ Output channel not found or is not a text channel.');
            }
        } catch (chanErr) {
            console.error('❌ Failed to send embed to output channel:', chanErr);
        }

        return await interaction.editReply({
            content: `✅ Test result successfully submitted and sent to <#${OUTPUT_CHANNEL_ID}>!${roleAddedStatus}`
        });
    }
};
