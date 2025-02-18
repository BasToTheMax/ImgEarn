require('dotenv').config();

let prompt = require('prompt-sync')();
let db = require('./db');

let log = console.log;

main();

function complete(commands) {
    return function (str) {
      var i;
      var ret = [];
      for (i=0; i< commands.length; i++) {
        if (commands[i].indexOf(str) == 0)
          ret.push(commands[i]);
      }
      return ret;
    };
  };

async function main() {
    console.clear(); 

    log(`Getting unpaid days...`);
    let pending = await getPending();

    log( '-'.repeat(process.stdout.columns) );

    // console.log(pending);
    for(let i = 0; i < pending.length; i++) {
        let p = pending[i];
        log(` | ${p.date} - ${p.totalViews} views`);
    }

    if (pending.length == 0) {
        log(` | No pending payments!`);
        process.exit(0);
    }

    log( '-'.repeat(process.stdout.columns) );

    let date = prompt('> Enter date: ', {
        autocomplete: complete(pending.map((p) => p.date))
    });

    console.clear();

    log(` | "${date}"`);

    log(' | Getting info...');
    let info = await getInfo(date);

    log(` | ${info.date} - ${info.totalViews} views`);
    
    let revenue = prompt(`> Enter revenue for ${date}: `);
    revenue = parseFloat(revenue);
    
    console.clear();

    log(` | Revenue: ${revenue}`);

    log( '-'.repeat(process.stdout.columns) );

    log(` | ${info.date} - ${info.totalViews} views`);
    log(` | ${info.date} - € ${revenue} revenue`);
    log(` | ${info.date} - € ${revenue/info.totalViews} per view`);

    log( '-'.repeat(process.stdout.columns) );

    let shouldGo = prompt(' > Continue? (y/n): ');
    if (shouldGo != 'y' && shouldGo != 'Y') {
        log(' > Exiting...');
        process.exit(0);
    }

    console.clear();

    log(' | Counting...');
    let uniqueImgCount = await db.DailyImageView.countDocuments({ date });
    let totalSiteImgs = await db.Image.countDocuments();
    log(` | ${uniqueImgCount} / ${totalSiteImgs} images found`);
    let percent = Math.round((uniqueImgCount/totalSiteImgs)*100);

    log(` | About ${percent}% of the images got at least one view.`);

    if (uniqueImgCount == 0) {
        log(` | Exiting...`);
        info.isPaid = true;
        await info.save();
        process.exit(0);
    }

    let revenuePerView = (revenue/info.totalViews).toFixed(5);

    log(` | ${Math.round(info.totalViews/uniqueImgCount)} average views/image | € ${((revenue/info.totalViews)*(info.totalViews/uniqueImgCount)).toFixed(5)} average per image`);

    let images = await db.DailyImageView.find({ date });
    for(let i = 0; i < images.length; i++) {
        let img = images[i];

        let toAdd = revenuePerView * img.views;

        let imag = await db.Image.findById(img.image);
        let user = await db.User.findById(imag.user);

        user.balance += toAdd;
        await user.save();

        log(` | Processed [${i+1}/${images.length}] € ${toAdd} for ${img.views} views`);

    }

    log(` | Done!`);
    info.isPaid = true;
    await info.save();
    log(` | Exiting...`);
    process.exit(0);
}

async function getPending() {
    let pending = await db.DailyStats.find({
        isPaid: false
    });
    return pending;
}

async function getInfo(date) {
    return await db.DailyStats.findOne({
        isPaid: false,
        date
    });
}