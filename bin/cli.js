#!/usr/bin/env node

const inquirer = require('inquirer');
const { exec } = require('child_process');
const { promisify } = require('util');
const Listr = require('listr');
const path = require('path');

const execPromise = promisify(exec)

const basicInfo = {
    projectDirectory: 'myproject',
    name: 'tms_modulename',
    jenkinsProject: 'trackingfe',
    jenkinsModule: 'module1'
}

const templateGIT = 'git@github.com:SBoudrias/Inquirer.js.git'

const questions = [
    {
        type: 'input',
        name: 'projectDirectory',
        message: "Where's your project directory",
        default() {
            return basicInfo.projectDirectory;
        },
    },
    {
        type: 'input',
        name: 'name',
        message: "What's your project name",
        default() {
            return basicInfo.name;
        },
    },
    {
        type: 'input',
        name: 'jenkinsProject',
        message: "What's your project name for the config.json of Shopee Deployment Platform",
        default() {
            return basicInfo.jenkinsProject;
        },
    },
    {
        type: 'input',
        name: 'jenkinsModule',
        message: "What's your module name for the config.json of Shopee Deployment Platform",
        default() {
            return basicInfo.jenkinsModule;
        },
    },
];

const tasks = new Listr([
    {
        title: 'Git',
        task: () => {
            return new Listr([
                {
                    title: 'Clone repo from remote',
                    task: () => execPromise(`git clone ${templateGIT}  ${basicInfo.projectDirectory} --depth=1`)
                    .then(res => {
                        console.log(res.stdout, res.stderr)
                    })
                },
                {
                    title: 'Remove origin git info',
                    task: () => execPromise(`rm -fr ${path.join(basicInfo.projectDirectory, '.git')}`).then(res => {
                        console.log(res.stdout, res.stderr)
                    })
                },
                {
                    title: 'Init git',
                    task: () => execPromise(`git init`, {cwd: basicInfo.projectDirectory}).then(res => {
                        console.log(res.stdout, res.stderr)
                    })
                }
            ], {concurrent: false})
        }
    },
    {
        title: 'Install package dependencies with Yarn',
        task: (ctx, task) => execPromise(`yarn`, {cwd: basicInfo.projectDirectory})
            .then(res => {
                console.log(res.stdout, res.stderr)
            })
            .catch(() => {
                ctx.yarn = false;
                task.skip('Yarn not available, install it via `npm install -g yarn`');
            })
    },
    {
        title: 'Install package dependencies with npm',
        enabled: ctx => ctx.yarn === false,
        task: () => execPromise(`npm install`, {cwd: basicInfo.projectDirectory}).then(res => {
            console.log(res.stdout, res.stderr)
        })
    },
    {
        title: 'List files',
        task: () => execPromise(`ls -al`, {cwd: basicInfo.projectDirectory}).then(res => {
            console.log(res.stdout, res.stderr)
        })
    },
]);


inquirer.prompt(questions)
.then((answers) => {
    Object.assign(basicInfo, answers);
    return inquirer.prompt([
        {
            type:'confirm',
            name:'confirm',
            message: `${JSON.stringify(answers, null, '  ')} \nIs it right?`,
            default: true,
        }
    ])
}).then((answers)=>{
    if (answers.confirm){
        return tasks.run()        
    }
}).catch(err => {
    console.error(err);
});

