function findDepDir(depDir) {
    const projDir = depDir.split(/[\\/]/);
    const indexOfPnpmDir =  projDir.indexOf('.pnpm');
    if (indexOfPnpmDir > -1) {
        return projDir.slice(0, indexOfPnpmDir).join('/') + '/yorkie';
    }

    return depDir;
}

module.exports = findDepDir