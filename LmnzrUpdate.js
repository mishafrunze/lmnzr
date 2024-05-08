/*
+ files to update should be store somewhere?
+ compare versioning
- then run npm update
- git hook version?
 */

import cliProgress          from 'cli-progress';
import fetch                from 'node-fetch';
import { exec, execSync }         from 'child_process';
import fse                  from 'fs-extra'
import path                 from 'path'

async function getUpdater() {
    try {
        const response  = await fetch('https://raw.githubusercontent.com/mishafrunze/lmnzr-update/main/files.json');
        return await response.json();
    } catch (e) {
        console.log('Error!', e);
    }
}


export function LmnzrUpdate (done) {

    console.log('---\nLmnzrUpdate is checking for updates...\n---');

    getUpdater().then((response) => {

        //const versionUpdate = response.version;
        const versionUpdate = '1.1.0';

        const packageJSON       = (fse.pathExistsSync('./package.json')) ? fse.readJsonSync('./package.json') : false;
        const versionCurrent    = (packageJSON) ? packageJSON.version : false;

        if (versionCurrent && versionCurrent < versionUpdate) {

            console.log('---\nStart updating...\n---');

            /* Check if ./.tmp/ exists, and delete in case it kept from previous update */
            if (fse.pathExistsSync('./.tmp/')) {
                fse.removeSync('./.tmp/');
            }

            console.log('---\nStart downloading files...\n---');
            /* Clone repo */
            exec('git clone https://github.com/mishafrunze/lmnzr.git .tmp', {}, () => {
                console.log('---\nFiles downloaded!...\n---');

                if (typeof response.files === 'object' && response.files.length > 0)
                {
                    console.log('---\nStart updating...\n---');

                    for (const file of response.files)
                    {

                        try {
                            fse.moveSync(
                                `./.tmp/${file}`,
                                `./${file}`,
                                { 'overwrite': true }
                            );
                            console.log('Updated ' + file);
                        } catch (e) {
                            console.log(e);
                        }

                    }

                    fse.removeSync('./.tmp/');

                    console.log('---\nUpdating successfully finished!\nRun `npm i` to update packages and don\'t forget to make a commit of your project!\n---');
                    done();

                }
                else
                {
                    console.log('---\nNo files to update.\n---');
                    done();
                }
            });
        } else {
            console.log('---\nNothing to update: you have the latest version of LMNZR in use (' + versionCurrent + ')...\n---');
            done();
        }

    });
}
