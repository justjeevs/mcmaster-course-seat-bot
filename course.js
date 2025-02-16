const puppeteer = require('puppeteer');
const nodeMailer = require('nodemailer');
const { scrollPageToBottom } = require('puppeteer-autoscroll-down');

const coursesUrl = 'https://mytimetable.mcmaster.ca/criteria.jsp';
const loginUrl = 'https://mytimetable.mcmaster.ca/login.jsp';
const macid = 'YOUR_MACID';
const password = 'YOUR_PASSWORD';
var needToEnrol = true;

const courseScraper = async () => {
    console.log(new Date() + ' starting fcn');
    while (needToEnrol) {
        var browser;
        try {
            browser = await puppeteer.launch({
                headless: 'new',
                defaultViewport: null,
                // args: [
                //     '--disable-web-security',
                //     '--disable-features=IsolateOrigins,site-per-process',
                //     '--disable-site-isolation-trials',
                // ],
            });
            const checkCoursePage = await browser.newPage();
            await checkCoursePage.goto(coursesUrl, {
                waitUntil: 'networkidle0',
            });
            let checkCoursePageHtml = await checkCoursePage.content();
            let countOfFullCourses =
                checkCoursePageHtml.match(/All classes are full/g);
            let numberOfMathCourseNameOccurences =
                checkCoursePageHtml.match(/MATH 2UU3/g);
            let numberOfSustainCourseNameOccurences =
                checkCoursePageHtml.match(/SUSTAIN 2GS3/g);
            if (
                (numberOfMathCourseNameOccurences != null ||
                    numberOfSustainCourseNameOccurences != null) &&
                (countOfFullCourses == null || countOfFullCourses.length < 2)
            ) {
                console.log(new Date() + ' course open!');
                const loginAndTryToEnrollPage = await browser.newPage();
                await loginAndTryToEnrollPage.goto(loginUrl);
                await loginAndTryToEnrollPage.waitForSelector('#word1');
                await loginAndTryToEnrollPage.type('#word1', macid);
                await loginAndTryToEnrollPage.waitForSelector('#word2');
                await loginAndTryToEnrollPage.type('#word2', password);
                await loginAndTryToEnrollPage.keyboard.press('Enter');
                await loginAndTryToEnrollPage.waitForSelector(
                    'a[href="javascript:UU.caseTermContinue(3202330);"]'
                );
                await loginAndTryToEnrollPage.click(
                    'a[href="javascript:UU.caseTermContinue(3202330);"]'
                );
                await loginAndTryToEnrollPage.waitForNavigation({
                    waitUntil: 'networkidle0',
                });
                await loginAndTryToEnrollPage.waitForSelector('#do_search');
                await loginAndTryToEnrollPage.click('#do_search');
                await loginAndTryToEnrollPage.waitForSelector(
                    'button[id="forfilter"]'
                );
                await loginAndTryToEnrollPage.click('button[id="forfilter"]');
                await loginAndTryToEnrollPage.waitForSelector(
                    'label[title="Allow schedule results containing full classes"]'
                );
                await loginAndTryToEnrollPage.click(
                    'label[title="Allow schedule results containing full classes"]'
                );
                await loginAndTryToEnrollPage.waitForSelector(
                    'button[class="mdl-button mdl-js-button mdl-button--raised mdl-button--accent popup-close focusable"]'
                );
                await loginAndTryToEnrollPage.click(
                    'button[class="mdl-button mdl-js-button mdl-button--raised mdl-button--accent popup-close focusable"]'
                );
                await loginAndTryToEnrollPage.waitForSelector(
                    'button[title="Go to the confirmation page to review details"]',
                    { timeout: 5000 }
                );
                await loginAndTryToEnrollPage.click(
                    'button[title="Go to the confirmation page to review details"]'
                );
                await scrollPageToBottom(loginAndTryToEnrollPage, {
                    size: 250,
                    delay: 250,
                });
                await loginAndTryToEnrollPage.waitForSelector(
                    '.big_button.button_do_actions'
                );
                await loginAndTryToEnrollPage.click(
                    '.big_button.button_do_actions'
                );
                await loginAndTryToEnrollPage.waitForNavigation({
                    waitUntil: 'networkidle0',
                });
                let loginAndTryToEnrollPageHtml =
                    await loginAndTryToEnrollPage.content();
                let enrollSuccessfulMessage = loginAndTryToEnrollPageHtml.match(
                    /This class has been added to your schedule./g
                );
                if (enrollSuccessfulMessage != null) {
                    console.log(new Date() + ' enrol successful');
                    needToEnrol = false;
                    await browser.close();
                    const transporter = nodeMailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: 'YOUR_EMAIL',
                            pass: 'YOUR_APP_PASSWORD',
                        },
                    });
                    const mailOptions = {
                        from: 'YOUR_EMAIL',
                        to: 'YOUR_EMAIL',
                        subject: 'McMaster Seat Bot has good news...',
                        text: 'Congratz, bot has enrolled in course for you!',
                    };
                    const info = await transporter.sendMail(mailOptions);
                    console.log(
                        new Date() + ' Email message sent: ' + info.messageId
                    );
                    return;
                } else {
                    console.log(new Date() + ' enrol failed');
                    await browser.close();
                }
            }
            if (browser) await browser.close();
            await new Promise((r) => setTimeout(r, 30000));
        } catch (err) {
            console.error(new Date() + ' err caught: ' + err);
            // console.trace();
            await browser.close();
            await new Promise((r) => setTimeout(r, 5000));
        }
    }
    console.log(new Date() + ' exiting fcn after while loop');
    return;
};

courseScraper();
