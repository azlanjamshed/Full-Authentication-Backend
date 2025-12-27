// const cron = require("node-cron")
// const userModel = require("../models/user.Model")

// const removeUnverifiedAccount = () => {
//     cron.schedule(' */30 * * * *', async () => {
//         const thirtyMinuteAgo = new Date(Date.now() - 30 * 60 * 1000)
//         await userModel.deleteMany({
//             accountVerified: fasle,
//             createdAt: { $lt: thirtyMinuteAgo }
//         })

//     });
// }

// module.exports = removeUnverifiedAccount

const cron = require("node-cron");
const userModel = require("../models/user.Model");

const removeUnverifiedAccount = () => {
    cron.schedule("*/30 * * * *", async () => {
        try {
            const thirtyMinuteAgo = new Date(Date.now() - 30 * 60 * 1000);

            const result = await userModel.deleteMany({
                accountVerified: false,
                createdAt: { $lt: thirtyMinuteAgo },
            });

            console.log(
                `🧹 Cron: Deleted ${result.deletedCount} unverified accounts`
            );
        } catch (error) {
            console.error("❌ Cron error:", error.message);
        }
    });
};

module.exports = removeUnverifiedAccount;