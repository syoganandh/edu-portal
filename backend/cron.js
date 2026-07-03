const cron = require('node-cron');
const Assignment = require('./models/Assignment');
const Notice     = require('./models/Notice');

// Runs every day at 8:00 AM
cron.schedule('0 8 * * *', async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const start = new Date(tomorrow.setHours(0,0,0,0));
    const end   = new Date(tomorrow.setHours(23,59,59,999));

    const dueAssignments = await Assignment.find({ dueDate: { $gte: start, $lte: end } });

    for (const asg of dueAssignments) {
      // Check if reminder already posted today
      const alreadyPosted = await Notice.findOne({
        title: { $regex: `Due Tomorrow` },
        message: { $regex: asg.title },
        createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) }
      });
      if (alreadyPosted) continue;

      await Notice.create({
        title: `⏰ Assignment Due Tomorrow`,
        message: `"${asg.title}" is due tomorrow. Make sure to submit your work on time!`,
        type: 'warning',
        course: asg.course
      });
      console.log(`✅ Deadline reminder posted for: ${asg.title}`);
    }
  } catch (err) {
    console.error('Cron error:', err.message);
  }
});

console.log('⏰ Cron job scheduled: Assignment deadline reminders at 8:00 AM daily');
