#!/bin/bash -e

set -eo pipefail

deploy() {
  if [[ -z $SKIP_BOOTSTRAP_AWS_CDK ]]; then
    # default behavior is to bootstrap
    # it's not particularly useful for existing environments, except to keep the CDKToolkit stack up to date
    echo "Will bootstrap (default behavior) as SKIP_BOOTSTRAP_AWS_CDK is not set"
    npx cdk bootstrap aws://${AWS_ACCOUNT_ID}/${AWS_DEFAULT_REGION}  ${CIRCLECI:+--progress events}
  else
    # skipping bootstrap makes sense in certain cases
    # e.g. for existing environments (account/region) with apps/stacks on different cdk major versions
    # although the CDKToolkitStack is often backward compatible, bootstrapping from an older cdk version will fail
    echo "Skipping cdk bootstrap command because SKIP_BOOTSTRAP_AWS_CDK is set"
  fi

  npx cdk deploy --require-approval "never"  ${CIRCLECI:+--progress events}
}

diff() {
  npx cdk diff
}

operation=$1
case $operation in
  diff) diff ;;
  deploy) deploy;;
  *) exit 1 ;;
esac
