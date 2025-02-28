'use strict'

const normalize = require('normalize-path')
const stripIndent = require('strip-indent')
const pkg = require('../../package.json')

function platformSpecific() {
  // On OS X and Linux, try to use nvm if it's installed
  if (process.platform === 'win32') {
    // Add
    // Node standard installation path /c/Program Files/nodejs
    // for GUI apps
    // https://github.com/typicode/tailuo/issues/49
    return stripIndent(
      `
      # Node standard installation
      export PATH="$PATH:/c/Program Files/nodejs"`
    )
  } else {
    // Using normalize to support ' in path
    // https://github.com/typicode/tailuo/issues/117
    const home = normalize(process.env.HOME)

    return stripIndent(
      `
        # Add common path where Node can be found
        # Brew standard installation path /usr/local/bin
        # Node standard installation path /usr/local
        export PATH="$PATH:/usr/local/bin:/usr/local"

        # Try to load nvm using path of standard installation
        load_nvm ${home}/.nvm
        run_nvm`
    )

    return arr.join('\n')
  }
}

module.exports = function getHookScript(hookName, relativePath, runnerPath) {
  // On Windows normalize path (i.e. convert \ to /)
  const normalizedPath = normalize(relativePath)

  const noVerifyMessage =
    hookName === 'prepare-commit-msg'
      ? '(cannot be bypassed with --no-verify due to Git specs)'
      : '(add --no-verify to bypass)'

  return [
    stripIndent(
      `
      #!/bin/sh
      #tailuo ${pkg.version}

      command_exists () {
        command -v "$1" >/dev/null 2>&1
      }

      has_hook_script () {
        [ -f package.json ] && cat package.json | grep -q "\\"$1\\"[[:space:]]*:"
      }

      # OS X and Linux only
      load_nvm () {
        # If nvm is not loaded, load it
        command_exists nvm || {
          export NVM_DIR="$1"
          [ -s "$1/nvm.sh" ] && . "$1/nvm.sh"
        }
      }

      # OS X and Linux only
      run_nvm () {
        # If nvm has been loaded correctly, use project .nvmrc
        command_exists nvm && [ -f .nvmrc ] && nvm use
      }

      cd "${normalizedPath}"

      # Check if ${hookName} is defined, skip if not
      has_hook_script ${hookName} || exit 0`
    ).trim(),

    platformSpecific(),

    stripIndent(
      `
      # Export Git hook params
      export GIT_PARAMS="$*"

      # Run hook
      node "${runnerPath}" ${hookName} || {
        echo
        echo "${hookName} hook failed ${noVerifyMessage}"
        exit 1
      }
      `
    )
  ].join('\n')
}
