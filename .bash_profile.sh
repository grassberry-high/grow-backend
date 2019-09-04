#------------------------------------------- DEPLOY ---------------------------------------------------------------
deployMenu() {
  noInstallDependencies=$1
  deployPath=$(jq -r '.["prod-deploy-path"]' ./package.json)

  if [[ $deployPath != null && $deployPath != "" ]]; then
    # deployIt "$deployPath"

    while true; do
      read -p "Do you wish to deploy to $deployPath" yn
      case $yn in
          [Yy]* ) deployIt "$deployPath" "$noInstallDependencies" && break;;
          [Nn]* ) break;;
          * ) echo "Please answer yes or no.";;
      esac
    done
  else
    echo "No Deploy Path"
    return 1
  fi
}

deployIt() {
  #set -x
  deployServerUser=$(jq -r '.["prod-deploy-server-user"]' ./package.json)
  deployServerIp=$(jq -r '.["prod-deploy-server-ip"]' ./package.json)
  deployServerPort=$(jq -r '.["prod-deploy-server-port"]' ./package.json)
  if [[ $deployServerUser == null || $deployServerUser == "" || $deployServerIp == null || $deployServerIp == "" || $deployServerPort == null || $deployServerPort == "" ]]; then
    echo "No Deploy Server"
    return 1
  fi

  deployPath=$1
  noInstallDependencies=$2

  deployShellScript=$(jq '.["prod-deploy-shell-script"]' ./package.json)

  echo "Deploying to $deployPath ($deployServerUser@$deployServerIp:$deployServerPort)"
  gulp build
  eval rsync -auz -r -e \"ssh -p $deployServerPort\" --delete --recursive dist/ $deployServerUser@$deployServerIp:$deployPath #--progress to show progress

  if [[ $deployPath == null || $deployPath == "" ]]; then
    echo "No Deploy Path"
    return 1
  fi

  if [[ $deployShellScript != null && $deployShellScript != "" ]]; then
    pwdPath=$(dirname $deployPath)
    echo "Copying package.json & bower.json to $pwdPath"
    eval rsync -auz -r -e \"ssh -p $deployServerPort\" --progress {bower.json,package.json} $deployServerUser@$deployServerIp:$pwdPath
    if [[ $noInstallDependencies == 'true' ]]; then
      echo ">>>> NO INSTALL"
      ssh -p $deployServerPort -t $deployServerUser@$deployServerIp "sudo bash \"$deployShellScript\" 'true'"
    else
      ssh -p $deployServerPort -t $deployServerUser@$deployServerIp sudo bash \"$deployShellScript\"
    fi
  fi

  localGit=$(jq -r '.["local-git"]' ./package.json)
  if [[ $localGit != "true" ]]; then
    echo "pushing to git $localGit"
    git push origin master
  fi

  copyProcessFiles=$(jq -r '.["copy-process-files"]' ./package.json)
  if [[ $copyProcessFiles == "true" ]]; then
    eval rsync -auz -r -e \"ssh -p $deployServerPort\" --progress {processes.json,deploy.sh} $deployServerUser@$deployServerIp:$pwdPath
  fi
}
