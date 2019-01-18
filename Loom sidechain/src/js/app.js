//truly global variables
var contractsList = [];
var map;
var account;

//Switch 2d/3d
var view2d;

//garbage map variables
var MapData;
var fillkeys;
var antikey;
var new_fills;

//Scale values
var currentScaleTransform;
var currentCircleScaleTransform;
var currentScale = { max: 80, currentShift: 0 };
var currentZoomTranslate = [0,0];
var currentZoomScale = 1;

//Map
var states = [];
var countryId = [];

//selectedCountry
var selected;
var selectedOwner;
var state_id;

//popups
var countryOnOff;
var playerOnOff;
var otherplayerOnOff;
var settingsOnOff
var logOnOff;
var marketOnOff;
var ownedCountriesOnOff;
var mobileMenuOnOff;

//bomb cards availability
var aval1;
var aval2;
var aval3;

//prevents web3 firinigs multiple blocks
var preventMultiLogs = false;

//Colors
var btcColor = 'rgb(255, 51, 51)';
var bchColor = 'rgb(51, 204, 51)';
var ethColor = 'rgb(26, 117, 255)';
var xrpColor = 'rgb(255, 255, 26)';
var defaultColor = 'rgba(140, 140, 140, 0.5)';
var MapborderColor = 'rgba(0,0,0,0.4)';
var MaphighlightFillColor = 'rgba(255, 255, 255,0.9)';
var MaphighlightBorderColor = 'rgba(0,0,0)';
var playerColor;

//Views
var btcView = [];
var bchView = [];
var ethView = [];
var xrpView = [];
var globalView = [];
var yoursView = [];

var Contract;

var contracts = {};


//APP
var App = class App {

 	async init(pubKey,privKey) {

	    var Attacks = await $.getJSON('../contracts/attacksContract.json');
	    contractsList.push(Attacks);
	    var Bombs = await $.getJSON('../contracts/bombCards.json');
	    contractsList.push(Bombs);
	    var Countries = await $.getJSON('../contracts/countriesContract.json');
	    contractsList.push(Countries);
	    var Crysk = await $.getJSON('../contracts/Crysk.json');
	    contractsList.push(Crysk);
	    var Market = await $.getJSON('../contracts/marketplaceContract.json');
	    contractsList.push(Market);
	    var Players = await $.getJSON('../contracts/playersContract.json');
	    contractsList.push(Players);

	    var privateKey = privKey;
	    var publicKey = pubKey;
	    if (publicKey == 0 && privateKey == 0) {
	      privateKey = loom.CryptoUtils.generatePrivateKey();
	      publicKey = loom.CryptoUtils.publicKeyFromPrivateKey(privateKey);
	      var pbK = publicKey;//CryptoUtils.bytesToHexAddr(this.publicKey);
	      var pvK = privateKey;//CryptoUtils.bytesToHexAddr(this.privateKey);
	      $('#expandableInfo').empty();
	      $('#loginFooter').empty();
	      $('#expandableInfo').append("<div style='position: relative; margin-top: 0%; margin-left: 0%; width: 100%; background: green; word-break: break-all;'><p class='thick'>Save them somewhere safe !</p><p class='thick'>Public Key: "+pbK+"</p>"+"<p class='thick'>Private Key: "+pvK+"</p><button class='btn btn-primary btn-block' id='createdAccount'>I've copied them. Reload and LogIn</button></div>");
	      $('#expandableInfo').on('click', function(){
	        window.location.reload();
	      });
	    }
	    else {
	      privateKey = new Uint8Array(privKey);
	      publicKey = loom.CryptoUtils.publicKeyFromPrivateKey(privateKey);
	    }
	    var client = new loom.Client(
	      'default',
	      'ws://127.0.0.1:46657/websocket',
	      'ws://127.0.0.1:9999/queryws',
	    )

	    client.on('error', msg => {
	      console.error('Error on connect to client', msg)
	      console.warn('Please verify if loom command is running')
	    })
	    var web3 = new Web3(new loom.LoomProvider(client, privateKey));
	    // Update this address before test
	    var currentUserAddress = loom.LocalAddress.fromPublicKey(publicKey).toString();
	    account = currentUserAddress;

	    //Here specify index of the contract you want to create from Index class
	    const networkId = "default";//await web3.eth.net.getId();

	    //Attacks
	    var currentNetwork = contractsList[0].networks[networkId];

	    if (!currentNetwork) {
	      throw Error('Contract not deployed on DAppChain');
	    }

	    var ABI = contractsList[0].abi;
	    var attacksInstance = new web3.eth.Contract(ABI, currentNetwork.address, {
	      from: currentUserAddress
	    })
	    contracts.attacksContract = attacksInstance;

      attacksInstance.events.newOwner({}, (err, result) => {
          if (err) console.error('Error on event', err);
          else {
              this.updatePlayerInfo(false);
              if (!err) {
                  if(account == result.returnValues[0]) {
                    var title = "You conquered a country !";
                    var text = "You succesfully invaded: " + result.returnValues[2] + "";
                    this.notify(title,text,2500);
                  }
                  //Notification if player's country has been conquered
	                if(account == result.returnValues[3]) {
	                  var title = "Warning!";
	                  var text =  result.returnValues[5] + " just conquered: " + result.returnValues[2] + "";
	                  this.notify(title,text,4000);
	                }

                  if (document.getElementById('logOpen').style.display == "block") blink('#logOpen');
	                var tmp;
	                if (result.returnValues[5] == "" || result.returnValues[5] == undefined) tmp = result.returnValues[0];
	                else tmp = result.returnValues[5];
	                logTeam("Player: " + result.returnValues[0] + " of " + result.returnValues[1] + " team conquered " + result.returnValues[2], result.transactionHash,result.returnValues[1]);
              }
          }
      });

      attacksInstance.events.attackInflicted({}, (err, result) => {
          if (err) console.error('Error on event', err);
          else {
              this.updatePlayerInfo(false);
              if (!err) {
                //Notification if player is attacker
                if(account == result.returnValues[0] && result.returnValues[1].toNumber() != 0 ) {
                  var title = "You attacked a country !";
                  var text = "You succesfully produced a damage of: " + result.returnValues[1].toNumber() + " to " + result.args.name;
                  this.notify(title,text,2500);
                }

                //Notification if player is victim
                if(account == result.returnValues[5] && result.returnValues[1].toNumber() != 0) {
                  var title = "Warning!";
                  var text =  result.returnValues[0] + " just inflicted you a damage of: " + result.returnValues[1].toNumber() + " in " + result.args.name;
                  this.notify(title,text,4000);
                }


                if (result.returnValues[1].toNumber() == 0) {
                  var tmp;
                  if (result.returnValues[5] == "" || result.returnValues[5] == undefined) tmp = result.args.adr;
                  else tmp = result.returnValues[5];
                  logTeam(" No damage inflicted from player: " + tmp + " to " + result.returnValues[2] + ", all the armies are lost", result.transactionHash, result.returnValues[3]);
                }

                this.updateCountryInfo(result.returnValues[2], false);

                if (document.getElementById('logOpen').style.display == "block") blink('#logOpen');
                if( result.returnValues[1].toNumber() != 0 ) logTeam("Damage of " + result.returnValues[1] + " inflicted from player: " + result.returnValues[0] + " to " + result.returnValues[2], result.transactionHash,result.returnValues[3]);
              }
          }
      });

	    //Bombs
	    currentNetwork = contractsList[1].networks[networkId];

	    if (!currentNetwork) {
	      throw Error('Contract not deployed on DAppChain');
	    }

	    ABI = contractsList[1].abi;
	    var bombsInstance = new web3.eth.Contract(ABI, currentNetwork.address, {
	      from: currentUserAddress
	    });
	    contracts.bombCards = bombsInstance;

      bombsInstance.events.buycard({}, (err, result) => {
          if (err) console.error('Error on event', err);
          else {
              this.updatePlayerInfo(false);
              if (!err) {
                this.updatePlayerInfo(false);
                this.updateCardsAvailability();
                this.loadPlayerCards();
                if(account == result.returnValues[0]) {
                    var title = "You bought a card!";
                    var text = "You succesfully bought Bomb" + result.returnValues[1];
                    this.notify(title,text,2500);
                }
            }
          }
      });

      bombsInstance.events.cardAvailable({}, (err, result) => {
          if (err) console.error('Error on event', err);
          else {
              this.updatePlayerInfo(false);
              if (!err) {
                this.updateCardsAvailability();
                this.loadPlayerCards();
            }
          }
      });

	    //Countries
	    currentNetwork = contractsList[2].networks[networkId];

	    if (!currentNetwork) {
	      throw Error('Contract not deployed on DAppChain');
	    }

	    ABI = contractsList[2].abi;
	    var countriesInstance = new web3.eth.Contract(ABI, currentNetwork.address, {
	      from: currentUserAddress
	    });
	    contracts.countriesContract = countriesInstance;

      countriesInstance.events.armyAdded({}, (err, result) => {
          if (err) console.error('Error on event', err);
          else {
              this.updatePlayerInfo(false);
              if (!err) {
                //direction == true ->army added, direction == false ->army removed
                if (result.returnValues[3] == true) {
                  //Notification if player the msg.sender
                  if(account == result.returnValues[2]) {
                    var title = "You're defenses are growing up !";
                    var text = "You succesfully added " + result.returnValues[0] + " armies in defense of " + result.returnValues[1];
                    this.notify(title,text,1800);
                  } else {
                    var tmp;
                    if (result.returnValues[4] == "" || result.returnValues[4] == undefined) tmp = result.returnValues[2];
                    else tmp = result.returnValues[4];
                    logTeam("Player: " + tmp + " added " + result.returnValues[0] +" soldiers defending " + result.returnValues[1],result.returnValues[2],undefined);
                  }
                } else {
                  if(account == result.returnValues[2]) {
                    var title = "You've recollected armies!";
                    var text = "You succesfully removed " + result.returnValues[0] + " armies from " + result.returnValues[1];
                    this.notify(title,text,1800);
                  } else {
                    var tmp;
                    if (result.returnValues[4] == "" || result.returnValues[4] == undefined) tmp = result.returnValues[2];
                    else tmp = result.returnValues[4];
                    logTeam("Player: " + tmp + " removed " + result.returnValues[0] +" soldiers from " + result.returnValues[1],result.returnValues[0],undefined);
                  }
                }
                this.updateCountryInfo(result.returnValues[1], false);
            }
          }
      });

      countriesInstance.events.attackInflicted({}, (err, result) => {
          if (err) console.error('Error on event', err);
          else {
              this.updatePlayerInfo(false);
              if (!err) {
                //Notification if player is attacker
                if(account == result.returnValues[0] && result.returnValues[1].toNumber() != 0) {
                  var title = "You attacked a country !";
                  var text = "You succesfully produced a damage of: " + result.returnValues[1].toNumber() + " to " + result.args.name + " and lost " + result.args.subs.toNumber() + " armies";
                  if(result.returnValues[6].toNumber() == 1) text = "You succesfully produced a damage of: " + result.returnValues[1].toNumber() + " to " + result.returnValues[2] + "";
                  this.notify(title,text,2500);
                  blinkBackground("red");
                }

                if(account == result.returnValues[0] && result.returnValues[1].toNumber() == 0) {
                  var title = "Your attack failed";
                  var text = "You lost " + result.returnValues[6].toNumber() + "armies";
                  this.notify(title,text,2500);
                }

                //Notification if player is victim
                if(account == result.returnValues[4] && result.returnValues[1].toNumber() != 0) {
                  var title = "Warning!";
                  var text =  result.returnValues[5] + " just inflicted you a damage of: " + result.returnValues[1].toNumber() + " in " + result.returnValues[2] + " losing "+ result.returnValues[6].toNumber() +" armies";
                  if(result.returnValues[6].toNumber() == 1) text =  result.returnValues[5] + " just inflicted you a damage of: " + result.returnValues[1].toNumber() + " in " + result.returnValues[2];
                  this.notify(title,text,4000);
                  blinkBackground("red");
                }


                if (result.returnValues[1].toNumber() == 0) {
                  var tmp;
                  if (result.returnValues[5] == "" || result.returnValues[5] == undefined) tmp = result.returnValues[0];
                  else tmp = result.returnValues[5];
                  logTeam(" No damage inflicted from player: " + tmp + " to " + result.returnValues[2] + ", all the armies are lost", result.transactionHash,result.returnValues[3]);
                }

                this.updateCountryInfo(result.returnValues[2], false);

                if (document.getElementById('logOpen').style.display == "block" ) blink('#logOpen');
                if( result.returnValues[1].toNumber() != 0 )logTeam("Damage of " + result.returnValues[1] + " inflicted from player: " + result.returnValues[0] + " to " + result.returnValues[2], result.transactionHash,result.returnValues[3]);
            }
          }
      });

      countriesInstance.events.bombInflicted({}, (err, result) => {
          if (err) console.error('Error on event', err);
          else {
              this.updatePlayerInfo(false);
              if (!err) {
  	              //Notification if player is attacker
  	              if(account == result.returnValues[0] ) {
  	                var title = "You attacked a country !";
  	                var text = "You succesfully dropped a Bomb" + result.returnValues[2].toNumber() + " to " + result.returnValues[1] + "";
  	                blinkBackground("red");
  	                this.notify(title,text,2500);
  	              }

  	              //Notification if player is victim
  	              if(account == result.returnValues[3] ) {
  	                var title = "Warning!";
  	                var text;
  	                if(result.returnValues[2].toNumber() == 1) text =  result.returnValues[5] + " just halved the lifepoints of " + result.returnValues[1] + " dropping a Bomb"+result.returnValues[2].toNumber() +"";
  	                if(result.returnValues[2].toNumber() == 2) text =  result.returnValues[5] + " just halved the lifepoints of " + result.returnValues[1] + " and a quarter of your armies dropping a Bomb"+result.returnValues[2].toNumber() +"";
  	                if(result.returnValues[2].toNumber() == 3) text =  result.returnValues[5] + " just reduced lifepoints of " + result.returnValues[1] + " to 1 and killed all your defending armies dropping a Bomb"+result.returnValues[2].toNumber() +"";
  	                this.notify(title,text,4000);
  	                blinkBackground("red");
  	              }

  	              this.updateCountryInfo(result.returnValues[1], false);

  	              if (document.getElementById('logOpen').style.display == "block" ) blink('#logOpen');
  	              logTeam("Player: " + result.returnValues[0] + " dropped a Bomb"+result.returnValues[2].toNumber()+ " to " + result.returnValues[1], result.transactionHash,result.returnValues[4]);
                }
              }
      });

	    //Crysk
	    currentNetwork = contractsList[3].networks[networkId];

	    if (!currentNetwork) {
	      throw Error('Contract not deployed on DAppChain');
	    }

	    ABI = contractsList[3].abi;
	    var cryskInstance = new web3.eth.Contract(ABI, currentNetwork.address, {
	      from: currentUserAddress
	    });
	    contracts.Crysk = cryskInstance;

	    //Market
	    currentNetwork = contractsList[4].networks[networkId];

	    if (!currentNetwork) {
	      throw Error('Contract not deployed on DAppChain');
	    }

	    ABI = contractsList[4].abi;
	    var marketInstance = new web3.eth.Contract(ABI, currentNetwork.address, {
	      from: currentUserAddress
	    });
	    contracts.marketplaceContract = marketInstance;

      marketInstance.events.buyEvent({}, (err, result) => {
          if (err) console.error('Error on event', err);
          else {
              this.updatePlayerInfo(false);
              if (!err) {
                //Update Owner, Price and Army
                this.updateCountryInfo(result.returnValues[1], false);

                //Notification if player is the buyer
                if(account == result.returnValues[0]) {
                  var title = "You bought a country !";
                  var text = "You succesfully bought: " + result.returnValues[1];
                  this.notify(title,text,2500);
                }

                //Notification if player's country has been bought
                if(account == result.returnValues[3]) {
                  var title = "Warning!";
                  var text =  result.returnValues[0] + " just bought from you: " + result.returnValues[1];
                  this.notify(title,text,4000);
                }


                var index;
                if(result.returnValues[2] == undefined || result == "") index = 0;
                if(result.returnValues[2] == "BTC") index = 1;
                if(result.returnValues[2] == "BCH") index = 2;
                if(result.returnValues[2] == "XRP") index = 3;
                if(result.returnValues[2] == "ETH") index = 4;
                var number;
                var i = 0;
                for(const item of states) {
                  if (item == result.returnValues[1]) {
                    number = i;
                  }
                  i++;
                }
                antikey = fillkeys[index];
                new_fills = {
                  [countryId[number]] : {
                    fillKey: antikey
                  }
                };

                MapData.updateChoropleth(new_fills);

                //App.updateMapColors();

                var color = this.pickPlayerColor(result.returnValues[0]);
                if (document.getElementById('logOpen').style.display == "block") blink('#logOpen');
                var tmp;
                if (result.returnValues[4] == "" || result.returnValues[4] == undefined) tmp = result.returnValues[0];
                else tmp = result.returnValues[4];
                logTeam("Player: " + tmp + " bought: " + result.returnValues[1], result.transactionHash,result.returnValues[2]);
              }
          }
      });

	    //Players
	    currentNetwork = contractsList[5].networks[networkId]

	    if (!currentNetwork) {
	      throw Error('Contract not deployed on DAppChain')
	    }

	    ABI = contractsList[5].abi
	    var playersInstance = new web3.eth.Contract(ABI, currentNetwork.address, {
	      from: currentUserAddress
	    })
	    contracts.playersContract = playersInstance;

      playersInstance.events.buyArmies({}, (err, result) => {
          if (err) console.error('Error on event', err);
          else {
              this.updatePlayerInfo(false);
              if (!err) {
                  if(account == result.returnValues[0]) {
                      var title = "Your armies are arrived !";
                      var text = "You succesfully bought armies and you're ready to attack!";
                      this.notify(title,text,2800);
                  }
              }
          }
      });

      playersInstance.events.playerCreated({}, (err, result) => {
          if (err) console.error('Error on event', err);
          else {
              this.updatePlayerInfo(false);
              if (!err) {
                  if(account != result.returnValues[0]) {
                    logTeam("Player: " + result.returnValues[0] + " joined the game ");
                  }
              }
          }
      });

      playersInstance.events.nextLevel({}, (err, result) => {
        if (err) console.error('Error on event', err);
        else {
            this.updatePlayerInfo(false);
            if (!err && preventMultiLogs == false) {
              if(account == result.returnValues[0]) {
                off("loadingModalContainer");
                var title = "Level UP !";
                var text = "You succesfully reached level: " + result.returnValues[1];
                this.notify(title,text,1500);
              }
              if (document.getElementById('logOpen').style.display == "block") blink('#logOpen');
              logTeam("Player: " + result.returnValues[3] + " reached level: " + result.returnValues[1], result.transactionHash, result.returnValues[2]);
          } else {
              console.log(error);
          }
            preventMultiLogs = true;
            avoidMultipleLogs();
        }
      });

      playersInstance.events.changedTeam({fromBlock: 'latest', toBlock: 'latest'}, (err, result) => {
          if (err) console.error('Error on event', err);
          else {
            this.updatePlayerInfo(false);
              if (!err && preventMultiLogs == false) {
                this.updateMapColors();
                if(account == result.returnValues[0]) {
                    off("loadingModalContainer");
                    var title = "You changed team !";
                    var text = "You succesfully changed team to: " + result.returnValues[1];
                    this.notify(title,text,1500);
                      this.updatePlayerInfo(false);
                  }
                  if (document.getElementById('logOpen').style.display == "block") blink('#logOpen');
                  var tmp;
                  if (result.returnValues[2] == "" || result.returnValues[2] == undefined) tmp = result.returnValues[0];
                  else tmp = result.returnValues[2];
                  logTeam("Player: " + tmp + " changed its team to: " + result.returnValues[1], result.transactionHash,result.returnValues[1]);
              } else {
                  console.log(error);
                  preventMultiLogs = true;
                  avoidMultipleLogs();
              }
          }
      });

      playersInstance.events.changedNickname({}, (err, result) => {
          if (err) console.error('Error on event', err);
          else {
              this.updatePlayerInfo(false);
              if (!err && preventMultiLogs == false) {
                  this.updateMapColors();
                if(account == result.returnValues[0]) {
                  off("loadingModalContainer");
                  var title = "You changed nickname !";
                  var text = "You succesfully changed nickname to: " + result.returnValues[1];
                  this.notify(title,text,1500);
              }
              if (document.getElementById('logOpen').style.display == "block") blink('#logOpen');
              var tmp;
              if (result.returnValues[2] == "" || result.returnValues[2] == undefined) tmp = result.returnValues[0];
              else tmp = result.returnValues[2];
              logTeam("Player: " + tmp + " changed its nickname to: " + result.returnValues[1], result.transactionHash, undefined);
            } else {
                console.log(error);
            }
              preventMultiLogs = true;
              avoidMultipleLogs();
          }
      });

      playersInstance.events.upgraded({}, (err, result) => {
          if (err) console.error('Error on event', err);
          else {
            this.updatePlayerInfo(false);
              if (!err) {

                var item;
                if(result.returnValues[1] == true) item = "defense power";
                if(result.returnValues[1] == false) item = "attack power";

                this.updateMapColors();
                if(account == result.returnValues[0]) {
                    var title = "Upgrade complete !";
                    var text = "You succesfully doubled your " + item + "";
                    this.notify(title,text,1500);
                }
              } else {
                console.log(error);
              }
          }
      });
  	}

	/*setPlayer() {

	    web3.eth.getAccounts(function(error, accounts) {

	      var accountInterval = setInterval(function() {

	        if (web3.eth.accounts[0] !== account && account != undefined) {
	          location.reload(true);
	        }

	        if (account == undefined && web3.eth.accounts[0] !== account) {
	          on("loadingContainer");
	          account = web3.eth.accounts[0];
	          App.updatePlayerInfo(false);
	        }
	      }, 100);
	    });
	}*/

	showUpgrades() {
	    $('#nextlevelModal').modal('show', {
	      backdrop: 'static',
	      keyboard: false
	    });
	    $('#upgradeArmyDamage').on('click', function() {
	      App.upgrade(true);
	    });
	    $('#upgradeDefense').on('click', function() {
	      App.upgrade(false);
	    });
    }
	//true -> attack, false -> defense
	upgrade(bool) {
	    web3.eth.getAccounts(function(error, accounts) {

		    if (error) {
		    	console.log(error);
		    }
		    cryskInstance = contracts.Crysk.methods;
		    $("#nextlevelModal").modal('hide');
		    if(bool == true) return cryskInstance.upgradeAttackDmg(account).call({from: account, gas:200000});
		    else if(bool == false) return cryskInstance.upgradeDefense(account).call({from: account, gas:200000});
		});
	}
	setNickName(name) {
	    var resolve = this;

	    var cryskInstance = contracts.Crysk.methods;
	    $("#popUp4").fadeOut("done", function() {settingsOnOff = false;});
	    on("settingsToggle");
	    cryskInstance.changeNickname(name).send({from: account}).then(function(result) {
	      if(result.status == true) {
	        resolve.updatePlayerInfo(false);
	        on("loadingContainer");
	      }
	      return result;
	    }).catch(function(err) {
	        this.notify("An error occurred while changing nickname", err,3000);
	        console.log(err.message);
	    });
	}
	playBombCard(number) {

	    var cryskInstance;
	    var itHasOne;

	    web3.eth.getAccounts(function(error, accounts) {

	        if (error) {
	        console.log(error);
	        }

	      cryskInstance = contracts.Crysk.methods;
	      cryskInstance.getUsercards().call({from: account}).then(function (result) {
	          itHasOne = false;
	          if(number == 1 && result[0]) itHasOne = true;
	          if(number == 2 && result[1]) itHasOne = true;
	          if(number == 3 && result[2]) itHasOne = true;
	          return itHasOne;
	      }).then(function (result) {
	          $('#cardsModalCenter').modal('hide');
	          if(result == true) return cryskInstance.applyBombCard(number, selected.properties.name).call({from: account, gas: 200000});
	          else return result;
	      }).then(function (result) {
	          if( result.receipt.status == "0x1") on('#loadingContainer');
	      }).catch(function(err) {
	          console.log(err.message);
	      });
	    });
	}
	loadPlayerCards() {

	    var cryskInstance;
	    var howmanyFirst;
	    var howmanySecond;
	    var howmanyThird;



	    web3.eth.getAccounts(function(error, accounts) {

	        if (error) {
	        console.log(error);
	        }

	        var cryskInstance = contracts.Crysk.methods;
            cryskInstance.getUsercards().call({from: account}).then(function (result) {
	          howmanyFirst = result[0];
	          howmanySecond = result[1];
	          howmanyThird =result[2];
	          return result;
	        }).then(function (result) {
	          $('#appendOnLoad').empty();
	          if (howmanyFirst == 0 && howmanySecond == 0 && howmanyThird == 0) {
	          	$("#cardsBarsButton").prop("disabled",true);
	          	$('#bombcardsBtn').attr('style', "display: none");
	          }
	          else $("#cardsBarsButton").prop("disabled",false);

	            for(var i = 0; i<howmanyFirst; i++) {

	             $('#appendOnLoad').append("<div class='carousel-item'><div class='card bg-secondary carouselCard'><img class='card-img-top' src='./images/bomb1.png' alt='Card image cap'><div class='card-body-adapted'><h5 class='card-title text-white'>Bomb1</h5><p class='card-text text-white'>It reduce the lifepoints of a country by a 50%</p><button class='btn btn-primary hide' id='drop1' onclick='App.playBombCard(1)'>Drop!</button></div></div></div>");
	            }

	            for(var i = 0; i<howmanySecond; i++) {

	             $('#appendOnLoad').append("<div class='carousel-item'><div class='card bg-secondary carouselCard'><img class='card-img-top' src='./images/bomb2.png' alt='Card image cap'><div class='card-body-adapted'><h5 class='card-title text-white'>Bomb2</h5><p class='card-text text-white'>It reduce the lifepoints of a country by a 50% and the armies by a 25%</p><button class='btn btn-primary hide' id='drop2' onclick='App.playBombCard(2)'>Drop!</button></div></div></div>");
	            }

	            for(var i = 0; i<howmanyThird; i++) {

	              $('#appendOnLoad').append("<div class='carousel-item'><div class='card bg-secondary carouselCard'><img class='card-img-top' src='./images/bomb3.png' alt='Card image cap'><div class='card-body-adapted'><h5 class='card-title text-white'>Bomb3</h5><p class='card-text text-white'>This remove all armies and 99% of lifepoints of a country</p><button class='btn btn-primary hide' id='drop3' onclick='App.playBombCard(3)'>Drop!</button></div></div></div>");
	            }
	          $("#appendOnLoad > .carousel-item").first().addClass("active");
	        }).catch(function(err) {
	          console.log(err.message);
	      });
	    });
	}
	changeView(name) {

    //Mark button as pressed and deselect the previous one
    var parentOld = $('#'+selectedView+'').closest('.btn');
    parentOld.removeClass('btn-light');
    parentOld.addClass('btn-dark');

    selectedView = name;
    var parentNew = $('#'+selectedView+'').closest('.btn');

    parentNew.removeClass('btn-dark');
    parentNew.addClass('btn-light');


    this.calculateViews();
}
	buyBomb(integer) {

    var cryskInstance;

    web3.eth.getAccounts(function(error, accounts) {

      if (error) {
      console.log(error);
      }

    cryskInstance = contracts.Crysk.methods;
    cryskInstance.getCardPrice(integer).call({from: account}).then(function(result) {
        var price = result;
        price += price/10;
        price = Math.ceil(price);
        $("#popUp5").fadeOut("done", function() {
          marketOnOff = false;
        });

        return cryskInstance.buyBombCards(integer).call({from: account, value: price});
      }).then(function(result) {
        if(result.receipt.status == "0x1") on("loadingContainer");
        if(result.receipt.status == "0x0") App.notify("There are no Bomb"+integer+" left", "You arrived too late",3000);
        return result;
      }).catch(function(err) {
        this.notify("An error occurred while buying Bomb"+integer+"", "Check MetaMask transaction and try again. Error: "+err+"",3000);
        console.log(err.message);
      });

    });
}
	calculateViews() {
    //RE-DO THE MAP
    if (view2d == true) {
      init2D();
      view2d = true;
    } else {
      init3D();
      view2d = false;
    }

    var i = 0;
    for(const item of states) {
        this.pickColor(item,i,false);
        i++;
    }

    setTimeout(function() {
        var i = 0;
        for(const item of states) {
          this.pickColor(item,i,false);
        i++;
        }
    },1500);
}
	pickColor(item,int,init) {
    var index;
    var player;
    var cryskInstance;

    var name = item;
    var number = int;

    web3.eth.getAccounts(function(error, accounts) {

        if (error) {
        console.log(error);
        }

        cryskInstance = contracts.Crysk.methods;
      	if(name) cryskInstance.getOwner(name).call({from: account}).then(function(result) {
          if(result == undefined) result = 0;
          player = result;
          return cryskInstance.getPlayerTeam(player).call({from: account});
        }).then(function(result) {
          if(result == undefined || result == "") index = 0;
          if(result == "BTC") {
            btcView[number] = 1;
            index = 1;
            if (player == account) yoursView[number] = 1;
            globalView[number] = 1;
          }
          if(result == "BCH") {
            bchView[number] = 2;
            index = 2;
            if (player == account) yoursView[number] = 2;
            globalView[number] = 2;
          }
          if(result == "XRP") {
            xrpView[number] = 3;
            index = 3;
            if (player == account) yoursView[number] = 3;
            globalView[number] = 3;
          }
          if(result == "ETH") {
            ethView[number] = 4;
            index = 4;
            if (player == account) yoursView[number] = 4;
            globalView[number] = 4;
          }
          return index;
          }).then(function(result) {

          if(init == true) {
            if(index != 0 ) {
              antikey = fillkeys[index];
              new_fills = {
                [countryId[number]] : {
                  fillKey: antikey
                }
              };
            }
          }
          else {
            if(index != 0 ) {

              if(globalView[number] == undefined && yoursView[number] == undefined && btcView[number] == undefined && bchView[number] == undefined && ethView[number] == undefined && xrpView[number] == undefined ) return;
              if(selectedView == "globalview") antikey = fillkeys[globalView[number]];
              if(selectedView == "yoursview") antikey = fillkeys[yoursView[number]];
              if(selectedView == "btcview") antikey = fillkeys[btcView[number]];
              if(selectedView == "bchview") antikey = fillkeys[bchView[number]];
              if(selectedView == "ethview") antikey = fillkeys[ethView[number]];
              if(selectedView == "xrpview") antikey = fillkeys[xrpView[number]];
              if(antikey == undefined) antikey = 0;
              new_fills = {
                [countryId[number]] : {
                  fillKey: antikey
                }
              };
              antikey = 0;
            }
          }


          MapData.updateChoropleth(new_fills);
          if(result == undefined) result = 0;
          return result;
          }).catch(function(err) {
            console.log(err.message);
          });

      });
}
	updatePlayerInfo(bool) {

    var cryskInstance;
    var experience;
    var level;
    var team;
    var ownedcountries;
    var army;
    var rgb;

    var resolve = this;

    web3.eth.getAccounts(function(error, accounts) {

        if (error) {
        console.log(error);
        }

        if(accounts.length != 0 ) $('#metamaskModal').modal('hide');
        else {
        	document.getElementById('errorMetamask').innerHTML = "Log into your wallet to unveil your address and start playing";
        }

        cryskInstance = contracts.Crysk.methods;
      	cryskInstance.getPlayerExpPts(account).call({from: account}).then(function(result) {
        		resolve.loadPlayerCards();
        		resolve.updateCardsAvailability();
       		experience = result;
        		document.getElementById('exp').innerHTML = "Experience: " + experience;
        		return experience;
     		}).then(function(instance) {

        		return cryskInstance.getPlayerLvl(account).call({from: account});
      	}).then(function(result) {
        		level = result;
        		document.getElementById('lvl').innerHTML = "Level: " + level ;
        		return level;
      	}).then(function(instance) {
        		return cryskInstance.getPlayerTeam(account).call({from: account});
      	}).then(function(result) {
        		team = result;
            //PERSONALIZE UI WITH THE CORRESPONDING COLOR

	            if(result == "BTC") {
              updateUi(btcColor);
            }
            if(result == "BCH") {
              updateUi(bchColor);
            }
            if(result == "XRP") {
              updateUi(xrpColor);
            }
            if(result == "ETH") {
              updateUi(ethColor);
            }
            document.getElementById('team').innerHTML = "Team: " + team ;
            return team;
        }).then(function(instance) {
            return cryskInstance.getTotalOwned(account).call({from: account});
        }).then(function(result) {
            ownedcountries = result;
            document.getElementById('owncntrs').innerHTML = "Owned countries: " + ownedcountries ;
            return ownedcountries;
        }).then(function(instance) {
            return cryskInstance.getAvailableArmy(account).call({from: account});
        }).then(function(result) {
            army = result;
            if (army == undefined) army = 0;
            document.getElementById('army').innerHTML = "Armies: " + army;
            return army;
        }).then(function(instance) {
            return cryskInstance.getPlayerNickname(account).call({from: account});
        }).then(function(result) {
            var nick = result;
            if (nick == "") {
	             //Initial modal
	            //if(sessionStorage.getItem('myModal') !== 'yes') {
	            $('#myModal').modal({
	              backdrop: 'static',
	              keyboard: false
	            });

            }
            else document.getElementById('nick').innerHTML =  "<font style='color: " +rgb +";'>" + nick + "</font>";
            resolve.getMultipliers();
            return nick;
        }).then(function(result){
            return cryskInstance.getPlayerUpgrades(account).call({from: account});
        }).then(function(result) {
            if(result > 0) on("upgradesButton");
            else off("upgradesButton");
            return result;
        }).then(function(result){
            if(bool != true) {
              blink('#menuToggle');
              off("loadingContainer");
            }
            return result;
        }).catch(function(err) {
            console.log(err.message);
        });

        document.getElementById('addr').innerHTML = "Address: " + account;

    });
}
	showOtherPlayer(name) {

    var cryskInstance;
    var experience;
    var level;
    var team;
    var ownedcountries;
    var army;
    var rgb;

    web3.eth.getAccounts(function(error, accounts) {

        if (error) {
        console.log(error);
        }

        cryskInstance = contracts.Crysk.methods;
        cryskInstance.getPlayerExpPts(name).call({from: account}).then(function(result) {
          experience = result;
          document.getElementById('otherexp').innerHTML = "Experience: " + experience;
          return experience;
        }).then(function(instance) {
          return cryskInstance.getPlayerLvl(name).call({from: account});
        }).then(function(result) {
          level = result;
          document.getElementById('otherlvl').innerHTML = "Level: " + level ;
          return level;
        }).then(function(instance) {
          return cryskInstance.getPlayerTeam(name).call({from: account});
        }).then(function(result) {
          team = result;
          document.getElementById('otherteam').innerHTML = "Team: " + team ;
          return team;
        }).then(function(instance) {
          return cryskInstance.getTotalOwned(name).call({from: account});
        }).then(function(result) {
          ownedcountries = result;
          document.getElementById('otherowncntrs').innerHTML = "Owned countries: " + ownedcountries ;
          return ownedcountries;
        }).then(function(instance) {
          return cryskInstance.getAvailableArmy(name).call({from: account});
        }).then(function(result) {
          army = result;
          if (army == undefined) army = 0;
          document.getElementById('otherarmy').innerHTML = "Armies: " + army;
          return army;
        }).then(function(instance) {
          return cryskInstance.getPlayerNickname(name).call({from: account});
        }).then(function(result) {
          var nick = result;
          if (nick == "") document.getElementById('othernick').innerHTML =  "<font style='color: " +rgb +";'>" + name + "";
          else document.getElementById('othernick').innerHTML =  "<font style='color: " +rgb +";'>" + nick + "";
          return nick;
        }).catch(function(err) {
          console.log(err.message);
        });

        web3.eth.getAccounts(function(error, accounts) {

          if (error) {
          console.log(error);
          }

          playersInstance = contracts.playersContract.methods;
          playersInstance.getArmyDamage(name, {from: account}).then(function(result) {
            document.getElementById('otheratck').innerHTML = "Attack power: " + result + "";
            return playersInstance.getArmyDefense(name).call({from: account});
          }).then(function(result) {
            document.getElementById('otherdfns').innerHTML = "Defense power: " + result + "";
            return result;
          }).catch(function(err) {
            console.log(err.message);
          });

        });

        document.getElementById('otheraddr').innerHTML = "Address: " + selectedOwner;
        $("#popUp3").fadeIn("done", function() {otherplayerOnOff = true;});

    });
}
	updateCountryInfo(name, bool) {

    var cryskInstance;
    var lifepoints;
    var rgb;
    var lock;

    web3.eth.getAccounts(function(error, accounts) {

      if (error) {
      console.log(error);
      }

      //var account = accounts[0];

      cryskInstance = contracts.Crysk.methods;
      cryskInstance.getTimer(name).call({from: account}).then(function(result) {
        if (result > 0) {
          lock = true;
          off("Attack");
          off("attackingInput");
          off("Buy");
          off("bombcardsBtn");
          document.getElementById('lock').style.display = 'block';
          document.getElementById('blocksleft').innerHTML = 'LOCKED Blocks left: ' + result + '';
        }
        else document.getElementById('lock').style.display = 'none';
        return cryskInstance.getPrice(name).call({from: account});
      }).then(function(result) {
        var price = result;
        if( name == selected.properties.name ) document.getElementById('Price').innerHTML = 'Price: ' + price/1000000000000000000 + " Eth" ; //CHECK ZEROES ARE CORRECT
        return price;
      }).then(function() {
        return cryskInstance.getArmy(name).call({from: account});
      }).then(function(result) {
        var army = result;
        if( name == selected.properties.name ) document.getElementById('Army').innerHTML = 'Defending armies: ' + army ;
        return cryskInstance.getLifePoints(name).call({from: account});
      }).then(function(result) {
        lifepoints = result;
        if( name == selected.properties.name ) document.getElementById('LifePts').innerHTML = 'LifePts: ' + lifepoints ;
        return cryskInstance.getOwner(name).call({from: account});
      }).then(function(result) {
        selectedOwner = result;
        if (selectedOwner == account) {
          off("lock");
          off("Attack");
          off("attackingInput");
          off("Buy");
          off("bombcardsBtn");
          on("ownedCountryToggle");
          on("defendingIn");
          on("defendingOut");
          on("defendingInput");
          on("defendingOutput");
          document.getElementById("lifepointsbtn").style.display = "flex";
          document.getElementById("Countrycard").style.height = '25vh';
          if(screen.width < 500) {
          	document.getElementById("Countrycard").style.height = '12rem';
        	document.getElementById("Countrycard").style.width = '67%';
          }
        }
        if (selectedOwner != undefined && selectedOwner != account && selectedOwner != 0x0000000000000000000000000000000000000000) {
          off("defendingIn");
          off("defendingOut");
          off("defendingInput");
          off("defendingOutput");
          off("lifepointsbtn");
          off("ownedCountryToggle");
          if(lock != true) {
            on("Attack");
            on("bombcardsBtn");
            App.loadPlayerCards();
            on("attackingInput");
            on("Buy");
          }
        }
        if (selectedOwner == 0x0000000000000000000000000000000000000000 ) {
          off("defendingIn");
          off("defendingOut");
          off("defendingInput");
          off("defendingOutput");
          off("lifepointsbtn");
          off("bombcardsBtn");
          off("ownedCountryToggle");
          on("Buy");
          off("Attack");
          off("attackingInput");
          if( name == selected.properties.name ) document.getElementById('Owner').innerHTML = 'There is no owner here, buy it!';
        }
        return cryskInstance.getPlayerTeam(selectedOwner).call({from: account});
      }).then(function(result) {
        if (result == "BTC") rgb = btcColor;
        if (result == "BCH") rgb = bchColor;
        if (result == "ETH") rgb = ethColor;
        if (result == "XRP") rgb = xrpColor;
        return cryskInstance.getPlayerNickname(selectedOwner).call({from: account});
      }).then(function(result) {
        if(result == "" && selectedOwner != 0x0000000000000000000000000000000000000000) document.getElementById('Owner').innerHTML = "<p>Owner: "+selectedOwner+"</p>";
        if(result != "" && selectedOwner != 0x0000000000000000000000000000000000000000) document.getElementById('Owner').innerHTML = "<p style='color: "+rgb+"';>Owner: "+ result +"</p>";
        $(document).on("click", "#Owner", function(event){
            this.showOtherPlayer(selectedOwner);
        });
      }).then(function(){
          if(bool != true) off("loadingContainer");
        }).catch(function(err) {
        console.log(err.message);
      });

    });
}
	showDiv(name) {

    $(".hideable").attr('display', 'block');

    document.getElementById('selectedState').innerHTML = 'Country:' + ' ' + name;

    off("defendingIn");
    off("defendingOut");
    off("defendingInput");
    off("defendingOutput");
    off("Attack");
    off("attackingInput");
    off("Buy");
    off("lifepointsbtn");
    off("bombcardsBtn");

    this.updateCountryInfo(name, false);
}
	updateMapColors() {
    var i = 0;
    for(const item of states) {
      this.pickColor(item,i,true);
      i++;
    }
}
	invade() {
    var objectId = selected.properties.iso;
    var objectName = selected.properties.name;
    var quantity = document.getElementById('attackingInput').value;;

    web3.eth.getAccounts(function(error, accounts) {

      if (error) {
      console.log(error);
      }

      //var account = accounts[0];

      cryskInstance = contracts.Crysk.methods;
      cryskInstance.itExists(objectName).call({from: account}).then(function(result) {
        if(result == true) return cryskInstance.getOwner(objectName).call({from: account} );
        //Consider showing a div with the error
        else {
          this.notify("You can't attack a virgin land", "You can still buy it!",2000);
          logTeam("You can't attack a virgin land. You can still buy it!");
        }
      }).then(function (result) {
        if(result != account) return cryskInstance.getAvailableArmy(account).call({from: account})
        else {
          this.notify("You own this country!", "avoid damaging yourself",2000);
          logTeam("You own this country! avoid damaging yourself");
        }
      }).then(function(result) {
          $("#popUp2").fadeOut("done", function() {
            countryOnOff = false;
          });
        if (result >= quantity) return cryskInstance.attack(objectName, quantity).call({from: account, gas:200000});
        else {
          this.notify("Error", "You don't have this number of armies",1500);
          logTeam("You don't have this number of armies");
          return false;
        }
        }).then(function(result){
        if(result != false && result.receipt.status == "0x1")  on("loadingContainer");
        if( result.receipt.status == "0x0") notify("Error while attacking", "Review your attack is legit", 3000)
          return result;
        }).catch(function(err) {
        this.notify("An error occurred while attacking" +objectName+"", "Check MetaMask transaction and try again. Error: "+err+"", 3000);
        console.log(err.message);
      });

    });
}
	addSoldiers() {
    var amount = document.getElementById('defendingInput').value;
    var objectId = selected.properties.iso;
    var objectName = selected.properties.name;

    web3.eth.getAccounts(function(error, accounts) {

      if (error) {
      console.log(error);
      }

      //var account = accounts[0];

      cryskInstance = contracts.Crysk.methods;
      cryskInstance.itExists(objectName).call({from: account}).then(function(result) {
        if(result == true) return cryskInstance.getOwner(objectName).call({from: account});
        //Consider showing a div with the error
        else {
          this.notify("You can't add soldiers in a virgin land","You can still buy it!",2000);
          logTeam("You can't add soldiers in a virgin land","You can still buy it!");
        }
      }).then(function(result) {
          if(result == account) return cryskInstance.getAvailableArmy(account).call({from: account});
          else {
            this.notify("Error", "You don't own this country!",2000);
            logTeam("You don't own this country!");
          }
        }).then(function(result) {
          $("#popUp6").fadeOut("done", function() {ownedCountriesOnOff = false;});
          if( amount <= result ) return cryskInstance.addArmyInState(amount, objectName).call({from: account});
          else {
            logTeam("You don't have enough armies to place!")
            this.notify("Error","You don't have enough armies to place!",1500)
            return false;
          }
        }).then(function(result){
          if (result != false && result.receipt.status == "0x1") on("loadingContainer");
          return result;
        }).catch(function(err) {
        this.notify("An error occurred while adding armies to" +objectName+"", "Check MetaMask transaction and try again. Error: "+err+"", 3000);
        console.log(err.message);
      });

    });
}
	subSoldiers() {
    var amount = document.getElementById('defendingOutput').value;
    var objectId = selected.properties.iso;
    var objectName = selected.properties.name;

    web3.eth.getAccounts(function(error, accounts) {

      if (error) {
      console.log(error);
      }

      cryskInstance = contracts.Crysk.methods;
      cryskInstance.itExists(objectName).call({from: account}).then(function(result) {
        if(result == true) return cryskInstance.getOwner(objectName).call({from: account});
        //Consider showing a div with the error
        else {
          this.notify("You can't take soldiers from a virgin land", "You can still buy it!",2000);
          logTeam("You can't take soldiers from a virgin land. You can still buy it!");
        }
      }).then(function(result) {
          if(result == account) return cryskInstance.getArmy(objectName).call({from: account});
          else {
            this.notify("Error","You don't own this country!",2000);
            logTeam("You don't own this country!");
          }
        }).then(function(result) {
          $("#popUp6").fadeOut("done", function() {ownedCountriesOnOff = false;});
          if( amount <= result ) return cryskInstance.subArmyFromState(amount, objectName).call({from: account});
          else {
            logTeam("You don't have enough armies to withdraw!")
            this.notify("Error","You don't have enough armies to withdraw!",1500)
            return false;
          }
        }).then(function(result){
          if (result != false && result.receipt.status == "0x1") on("loadingContainer");
          return result;
        }).catch(function(err) {
        this.notify("An error occurred while removing armies from" +objectName+"", "Check MetaMask transaction and try again. Error: "+err+"", 3000);
        console.log(err.message);
      });

    });
}
  getMultipliers() {

    web3.eth.getAccounts(function(error, accounts) {

      if (error) {
      console.log(error);
      }

      var playersInstance = contracts.playersContract.methods;
    	  playersInstance.getArmyDamage(account).call({from: account}).then(function(result) {
          document.getElementById('atck').innerHTML = "Attack power: " + result + "";
          return playersInstance.getArmyDefense(account).call({from: account});
      }).then(function(result) {
          document.getElementById('dfns').innerHTML = "Defense power: " + result + "";
          return result
      }).catch(function(err) {
        console.log(err.message);
      });

    });
}
	Buy() {

	    //event.preventDefault();

	    var objectId = selected.properties.iso;
	    var objectName = selected.properties.name;
	    var objectContinent = '';
	    var cryskInstance;
	    var itexists;
	    var index;

	    web3.eth.getAccounts(function(error, accounts) {

	      if (error) {
	      console.log(error);
	      }

	      cryskInstance = contracts.Crysk.methods;
	      cryskInstance.itExists(objectName).call({from: account}).then(function(result) {
	        itexists = result;
	        return cryskInstance.getPrice(objectName).call({from: account});
	      }).then(function(result) {
	        var price = result;
	        price += price/10;
	        price = Math.ceil(price);
	        $("#popUp2").fadeOut("done", function() {
	          countryOnOff = false;
	        });
	        return cryskInstance.buyObject(objectName).call({from: account, value: price});
	      }).then(function(result) {
	        if(result.receipt.status == "0x1") on("loadingContainer");
	        return cryskInstance.getPlayerTeam(account).call({from: account});
	      }).catch(function(err) {
	        this.notify("An error occurred while buying "+objectName+"", "Check MetaMask transaction and try again. Error: "+err+"",3000);
	        console.log(err.message);
	      });

	    });
 	}
	setTeam() {

	    var cryskInstance;
	    var input = document.getElementById("inputGroupSelect");
	    var team = input.options[input.selectedIndex].text;
	    var resolve = this;

	    web3.eth.getAccounts(function(error, accounts) {

	        if (error) {
	          console.log(error);
	        }

	        cryskInstance = contracts.Crysk.methods;
      		$("#popUp4").fadeOut("done", function() {settingsOnOff = false;});
            on("settingsToggle");
      		on("loadingContainer");
      		cryskInstance.changeTeam(team).send({from: account}).then(function(result) {
        		if(result.status == true) resolve.updatePlayerInfo(false);
       			$("#popUp").fadeOut();
      		}).catch(function(err) {
        		this.notify("An error occurred while changing your team", "Check MetaMask transaction and try again. Error: "+err+"",3000);
        		console.log(err.message);
      		});
	   	});
	    //location.reload();
    }
	buyLifePoints() {
    var amount = document.getElementById('lifepointsnum').value;
    var playerlevel;
    var unitprice;
    var cryskInstance;
    var name = selected.properties.name;

    if(amount == 0) return;

    web3.eth.getAccounts(function(error, accounts) {

      if (error) {
      console.log(error);
      }

      cryskInstance = contracts.Crysk.methods;
      cryskInstance.getPlayerLvl(account).call({from: account}).then(function(result) {
        playerlevel = result;
        if(playerlevel == 0) playerlevel = 1;
        return playerlevel;
      }).then(function(instance) {
        return cryskInstance.getLifePointUnitPrice().call({from: account});
      }).then(function(result) {
        unitprice = result;
        return unitprice;
      }).then(function(instance) {
        var finalprice = unitprice*amount/playerlevel;
        finalprice += finalprice/10;
        finalprice = Math.ceil(finalprice);
        $("#popUp6").fadeOut("done", function() {ownedCountriesOnOff = false;});
        return cryskInstance.buyLifePoints(name, amount).call({from: account, value: finalprice});
      }).then(function(result) {
        if(result.receipt.status == "0x1") on("loadingContainer");
      }).catch(function(err) {
        this.notify("An error occurred while buying armies", "Check MetaMask transaction and try again. Error: "+err+"",3000);
        console.log(err.message);
      });

    });
}
  BuyArmy() {
	    var amount = document.getElementById('armiesnum').value;
	    var playerlevel;
	    var unitprice;
	    var cryskInstance;

	    if(amount == 0) return;

	    web3.eth.getAccounts(function(error, accounts) {

	      if (error) {
	      console.log(error);
	      }

	      //var account = accounts[0];

	      cryskInstance = contracts.Crysk.methods;
          cryskInstance.getPlayerLvl(account).call({from: account}).then(function(result) {
	        playerlevel = result;
	        if(playerlevel == 0) playerlevel = 1;
	        return playerlevel;
	      }).then(function(instance) {
	        return cryskInstance.getArmyUnitPrice().call({from: account});
	      }).then(function(result) {
	        unitprice = result;
	        return unitprice;
	      }).then(function(instance) {
	        var finalprice = unitprice*amount/playerlevel;
	        finalprice += finalprice/10;
	        finalprice = Math.ceil(finalprice);
	        $("#popUp").fadeOut("done", function() {playerOnOff = false;});
	        return cryskInstance.buyArmy(amount).call({from: account, value: finalprice});
	      }).then(function(result) {
	        if(result.receipt.status == "0x1") on("loadingContainer");
	      }).catch(function(err) {
	        this.notify("An error occurred while buying armies", "Check MetaMask transaction and try again. Error: "+err+"",3000);
	        console.log(err.message);
	      });

	    });
	}
	/*refreshData() {
	    var x = 3;  //1 second

	      //CHECK IF TRUE OR FALSE IS CORRECT
	    this.setPlayer();

	    setTimeout(this.setPlayer(), x*1000);
	}*/
  pickPlayerColor(player) {

	    var index;

	    web3.eth.getAccounts(function(error, accounts) {

	        if (error) {
	        console.log(error);
	        }

			cryskInstance = contracts.Crysk.methods;
	        cryskInstance.getPlayerTeam(player).call({from: account}).then(function(result) {
	          if(result == undefined || result == "") index = 0;
	          if(result == "BTC") index = 1;
	          if(result == "BCH") index = 2;
	          if(result == "XRP") index = 3;
	          if(result == "ETH") index = 4;
	          return index;
	    	}).catch(function(err) {
	        	console.log(err.message);
	    	});
		});

	    return index;
	}
	notify(notificationTitle, notificationText, clock) {

	    //App.updatePlayerInfo(false);
	    $('#info').append('<div class="modal fade text-white" id="infoModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true"><div class="modal-dialog modal-dialog-centered" role="document"><div class="modal-content"><div class="modal-header"><h5 class="modal-title text-dark" id="exampleModalLabel">' + notificationTitle + '</h5><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button></div><div class="modal-body bg-dark text-white">' + notificationText + '</div></div></div></div>');
	    $('#infoModal').modal({
	      backdrop: 'static',
	      keyboard: false
	    });
	    setTimeout(function(){
	      $("#infoModal").removeClass('fade').modal('hide');
	      $("#info").empty();
	    }, clock);
	}
	getNick(adr) {

	    var nick;
	    web3.eth.getAccounts(function(error, accounts) {

	      if (error) {
	        console.log(error);
	      }

	      cryskInstance = contracts.Crysk.methods;
	      cryskInstance.getPlayerNickname(adr).call({from: account}).then(function(result) {
	        if(result != "" || result != undefined) nick = result;
	        else nick = adr;
	        return nick;
	      }).catch(function(err) {
	        console.log(err.message);
	      });
	    });

	    return nick;
  	}
	updateCardsAvailability() {

	    var bombCardsInstance;
	    $('#availabilityBomb1').empty();
	    $('#availabilityBomb2').empty();
	    $('#availabilityBomb3').empty();
	    var avb

	    web3.eth.getAccounts(function(error, accounts) {



	      if (error) {
	        console.log(error);
	      }

	      bombCardsInstance = contracts.bombCards.methods;
      	  bombCardsInstance.getAvailability(1).call({from: account}).then(function(result) {

	        avb = 'green';
	        //one available
	        if(result == 1) aval1 = 1;
	        //two availables
	        if(result == 2) aval1 = 2;
	        //three availables
	        if(result == 3) aval1 = 3;
	        //zero available //COLOR BY RED
	        if(result == 0) {
	          avb = 'red';
	          aval1 = 0;
	        }

	        return bombCardsInstance.getAvailability(2).call({from: account});
	      }).then(function(result) {

	        avb = 'green';
	        //one available
	        if(result == 1) aval2 = 1;
	        //two availables
	        if(result == 2) aval2 = 2;
	        //three availables
	        if(result == 3) aval2 = 3;
	        //zero available //COLOR BY RED
	        if(result == 0) {
	          avb = 'red';
	          aval2 = 0;
	        }

	        return bombCardsInstance.getAvailability(3).call({from: account});
	      }).then(function(result) {

	        avb = 'green';
	        //one available
	        if(result == 1) aval3 = 1;
	        //two availables
	        if(result == 2) aval3 = 2;
	        //three availables
	        if(result == 3) aval3 = 3;
	        //zero available //COLOR BY RED
	        if(result == 0) {
	          avb = 'red';
	          aval3 = 0;
	        }

	      }).catch(function(err) {
	        console.log(err.message);
	      });
	    });

	    $('#availabilityBomb1').append("<p class='thick'><font color="+avb+">Availables: " + aval1 +"/3</font></p>");
	    $('#availabilityBomb2').append("<p class='thick'><font color="+avb+">Availables: " + aval2 +"/3</font></p>");
	    $('#availabilityBomb3').append("<p class='thick'><font color="+avb+">Availables: " + aval3 +"/3</font></p>");
	}
	listenToEvents() {
	    var newPlayerEvent;
	    var buyEvent;
	    var nextLevelEvent;
	    var attackInflictedEvent;
	    var attackInflictedEvent2;
	    var changedTeamEvent;
	    var newOwnerEvent;
	    var buyArmyEvent;
	    var armyAddedEvent;
	    var upgradedEvent;
	    var changedNickname;
	    var buycard;
	    var cardAvailable;
	    var bombInflicted;
	//UNCOMMENT TO MAKE THEM WORK AGAIN
	/*
	    //players
	    web3.eth.getAccounts(function(error, accounts) {

	      if (error) {
	      console.log(error);
	      }

	      //var account = accounts[0];

	      App.contracts.playersContract.deployed().then(function(instance) {
	        playersInstance = instance;
	        return playersInstance;
	      }).then(function(result) {
	          newPlayerEvent = playersInstance.playerCreated({fromBlock:'latest'});
	          changedNickame = playersInstance.changedNickname({fromBlock:'latest'});
	          nextLevelEvent = playersInstance.nextLevel({fromBlock:'latest'});
	          changedTeamEvent = playersInstance.changedTeam({fromBlock:'latest'});
	          buyArmyEvent = playersInstance.buyArmies({fromBlock:'latest'});
	          upgradedEvent = playersInstance.upgraded({fromBlock:'latest'});
	      }).then(function() {

	        buyArmyEvent.watch(function(error, result){
	          App.updatePlayerInfo(false);
	          if (!error) {
	            if(account == result.args.adr) {
	              var title = "Your armies are arrived !";
	              var text = "You succesfully bought armies and you're ready to attack!";
	              App.notify(title,text,2800);

	            }
	          } else {

	            console.log(error);
	          }
	        });

	        newPlayerEvent.watch(function(error, result){
	          if (!error && preventMultiLogs == false) {

	            logTeam( "New player just subscribed. Say hi to: " + result.args.adr,result.transactionHash,undefined);
	          } else {

	            console.log(error);
	          }
	          preventMultiLogs = true;
	          avoidMultipleLogs();

	        });

	        nextLevelEvent.watch(function(error, result){
	          var results = result;
	          App.updatePlayerInfo(false);
	          if (!error && preventMultiLogs == false) {
	            if(account == result.args.adr) {
	              //$('#nextlevel').append('');
	              $('#nextlevelModal').modal({
	                backdrop: 'static',
	                keyboard: false
	              });
	                $('#upgradeArmyDamage').on('click', function() {
	                  App.upgrade(true);
	                });
	                $('#upgradeDefense').on('click', function() {
	                  App.upgrade(false);
	                });
	            }


	            if (document.getElementById('logOpen').style.display == "block") blink('#logOpen');
	            var tmp;
	            if (result.args.nick == "" || result.args.nick == undefined) tmp = result.args.adr;
	            else tmp = result.args.nick;
	            logTeam("Player: " + tmp + " level up !", result.transactionHash,result.args.team);
	          } else {
	            console.log(error);
	          }
	          preventMultiLogs = true;
	          avoidMultipleLogs();
	        });

	        changedTeamEvent.watch(function(error, result){
	          App.updatePlayerInfo(false);
	          if (!error && preventMultiLogs == false) {

	            //Repaint the map with the new team color

	            App.updateMapColors();
	            if(account == result.args.adr) {
	              off("loadingModalContainer");
	              var title = "You changed team !";
	              var text = "You succesfully changed team to: " + result.args.name;
	              App.notify(title,text,1500);
	              App.updatePlayerInfo(false);

	            }
	            if (document.getElementById('logOpen').style.display == "block") blink('#logOpen');
	            var tmp;
	            if (result.args.nick == "" || result.args.nick == undefined) tmp = result.args.adr;
	            else tmp = result.args.nick;
	            logTeam("Player: " + tmp + " changed its team to: " + result.args.name, result.transactionHash,result.args.team);
	          } else {
	            console.log(error);
	            preventMultiLogs = true;
	            avoidMultipleLogs();
	          }

	        });

	        changedNickame.watch(function(error, result) {
	          App.updatePlayerInfo(false);
	          if (!error && preventMultiLogs == false) {

	            //Repaint the map with the new team color

	            App.updateMapColors();
	            if(account == result.args.adr) {
	              off("loadingModalContainer");
	              var title = "You changed nickname !";
	              var text = "You succesfully changed nickname to: " + result.args.nick;
	              App.notify(title,text,1500);
	            }
	            if (document.getElementById('logOpen').style.display == "block") blink('#logOpen');
	            var tmp;
	            if (result.args.oldnick == "" || result.args.oldnick == undefined) tmp = result.args.adr;
	            else tmp = result.args.oldnick;
	            logTeam("Player: " + tmp + " changed its nickname to: " + result.args.nick, result.transactionHash,result.args.team);
	          } else {
	            console.log(error);
	          }
	          preventMultiLogs = true;
	          avoidMultipleLogs();
	        });

	        upgradedEvent.watch(function(error, result) {
	          App.updatePlayerInfo(false);
	          if (!error) {

	            //Repaint the map with the new team color
	            var item;
	            if(result.args.toggle == true) item = "defense power";
	            if(result.args.toggle == false) item = "attack power";

	            App.updateMapColors();
	            if(account == result.args.adr) {
	              var title = "Upgrade complete !";
	              var text = "You succesfully doubled your " + item + "";
	              App.notify(title,text,1500);

	            }
	          } else {
	            console.log(error);
	          }
	        });

	      }).catch(function(err) {
	        console.log(err.message);
	      });
	    });

	    //countries
	    web3.eth.getAccounts(function(error, accounts) {

	      if (error) {
	      console.log(error);
	      }

	      //var account = accounts[0];

	      App.contracts.countriesContract.deployed().then(function(instance) {
	        countriesInstance = instance;
	        return countriesInstance;
	      }).then(function(result) {
	          attackInflictedEvent = countriesInstance.attackInflicted({fromBlock:'latest'});
	          armyAddedEvent = countriesInstance.armyAdded({fromBlock:'latest'});
	          bombInflicted = countriesInstance.bombInflicted({fromBlock:'latest'});
	      }).then(function() {

	          armyAddedEvent.watch(function(error, result){
	              App.updatePlayerInfo(false);
	              if (!error && preventMultiLogs == false) {
	                //direction == true ->army added, direction == false ->army removed
	                if (result.args.direction == true) {
	                  //Notification if player the msg.sender
	                  if(account == result.args.adr) {
	                    var title = "You're defenses are growing up !";
	                    var text = "You succesfully added " + result.args.amount + " armies in defense of " + result.args.name;
	                    App.notify(title,text,1800);
	                  } else {
	                    var tmp;
	                    if (result.args.nick == "" || result.args.nick == undefined) tmp = result.args.adr;
	                    else tmp = result.args.nick;
	                    logTeam("Player: " + tmp + " added " + result.args.amount +" soldiers defending " + result.args.name,result.args.adr,undefined);
	                  }
	                } else {
	                  if(account == result.args.adr) {
	                    var title = "You've recollected armies!";
	                    var text = "You succesfully removed " + result.args.amount + " armies from " + result.args.name;
	                    App.notify(title,text,1800);
	                  } else {
	                    var tmp;
	                    if (result.args.nick == "" || result.args.nick == undefined) tmp = result.args.adr;
	                    else tmp = result.args.nick;
	                    logTeam("Player: " + tmp + " removed " + result.args.amount +" soldiers from " + result.args.name,result.args.adr,undefined);
	                  }
	                }
	                preventMultiLogs = true;
	                avoidMultipleLogs();

	                App.updateCountryInfo(result.args.name, false);
	              } else {

	                console.log(error);
	              }
	          });

	          attackInflictedEvent.watch(function(error, result){
	              App.updatePlayerInfo(false);
	              if (!error && preventMultiLogs == false) {

	                //Notification if player is attacker
	                if(account == result.args.adr && result.args.num.toNumber() != 0) {
	                  var title = "You attacked a country !";
	                  var text = "You succesfully produced a damage of: " + result.args.num.toNumber() + " to " + result.args.name + " and lost " + result.args.subs.toNumber() + " armies";
	                  if(result.args.subs.toNumber() == 1) text = "You succesfully produced a damage of: " + result.args.num.toNumber() + " to " + result.args.name + "";
	                  App.notify(title,text,2500);
	                  blinkBackground("red");
	                }

	                if(account == result.args.adr && result.args.num.toNumber() == 0) {
	                  var title = "Your attack failed";
	                  var text = "You lost " + result.args.subs.toNumber() + "armies";
	                  App.notify(title,text,2500);
	                }

	                //Notification if player is victim
	                if(account == result.args.victim && result.args.num.toNumber() != 0) {
	                  var title = "Warning!";
	                  var text =  result.args.nick + " just inflicted you a damage of: " + result.args.num.toNumber() + " in " + result.args.name + " losing "+result.args.subs.toNumber() +" armies";
	                  if(result.args.subs.toNumber() == 1) text =  result.args.nick + " just inflicted you a damage of: " + result.args.num.toNumber() + " in " + result.args.name;
	                  App.notify(title,text,4000);
	                  blinkBackground("red");
	                }


	                if (result.args.num.toNumber() == 0) {
	                  var tmp;
	                  if (result.args.nick == "" || result.args.nick == undefined) tmp = result.args.adr;
	                  else tmp = result.args.nick;
	                  logTeam(" No damage inflicted from player: " + tmp + " to " + result.args.name + ", all the armies are lost", result.transactionHash,result.args.team);
	                }

	                App.updateCountryInfo(result.args.name, false);

	                if (document.getElementById('logOpen').style.display == "block" ) blink('#logOpen');
	                if( result.args.num.toNumber() != 0 )logTeam("Damage of " + result.args.num + " inflicted from player: " + result.args.adr + " to " + result.args.name, result.transactionHash,result.args.team);
	                preventMultiLogs = true;
	                avoidMultipleLogs();
	              } else {
	                //$("#loader").hide();
	                console.log(error);
	              }
	          });

	          bombInflicted.watch(function(error, result) {

	              //Notify the attackedplayer with the dropped bomb and losted quantities, logs it to log console

	              //Notify who drops of the succesfull attacck

	            App.updatePlayerInfo(false);
	            if (!error && preventMultiLogs == false) {

	              //Notification if player is attacker
	              if(account == result.args.adr ) {
	                var title = "You attacked a country !";
	                var text = "You succesfully dropped a Bomb" + result.args.index.toNumber() + " to " + result.args.name + "";
	                blinkBackground("red");
	                App.notify(title,text,2500);
	              }

	              //Notification if player is victim
	              if(account == result.args.victim ) {
	                var title = "Warning!";
	                var text;
	                if(result.args.index.toNumber() == 1) text =  result.args.nick + " just halved the lifepoints of " + result.args.name + " dropping a Bomb"+result.args.index.toNumber() +"";
	                if(result.args.index.toNumber() == 2) text =  result.args.nick + " just halved the lifepoints of " + result.args.name + " and a quarter of your armies dropping a Bomb"+result.args.index.toNumber() +"";
	                if(result.args.index.toNumber() == 3) text =  result.args.nick + " just reduced lifepoints of " + result.args.name + " to 1 and killed all your defending armies dropping a Bomb"+result.args.index.toNumber() +"";
	                App.notify(title,text,4000);
	                blinkBackground("red");
	              }

	              App.updateCountryInfo(result.args.name, false);

	              if (document.getElementById('logOpen').style.display == "block" ) blink('#logOpen');
	              logTeam("Player: " + result.args.adr + " dropped a Bomb"+result.args.index.toNumber()+ " to " + result.args.name, result.transactionHash,result.args.team);
	              preventMultiLogs = true;
	              avoidMultipleLogs();
	            } else {
	              //$("#loader").hide();
	              console.log(error);
	            }

	          });

	      }).catch(function(err) {
	        console.log(err.message);
	      });
    	});

	    //attacks
	    web3.eth.getAccounts(function(error, accounts) {

	      if (error) {
	        console.log(error);
	      }

	      //var account = accounts[0];

	      App.contracts.attacksContract.deployed().then(function(instance) {
	          attacksInstance = instance;
	          return attacksInstance;
	      }).then(function(result) {
	            attackInflictedEvent2 = attacksInstance.attackInflicted({fromBlock:'latest'});
	            newOwnerEvent = attacksInstance.newOwner({fromBlock:'latest'});
	      }).then(function() {

	            newOwnerEvent.watch(function(error, result){
	              App.updatePlayerInfo(false);
	              if (!error && preventMultiLogs == false) {

	                App.updateMapColors();
	                App.updateCountryInfo(result.args.country, false);

	                //Notification if player is winner
	                if(account == result.args.adr) {
	                  var title = "You conquered a country !";
	                  var text = "You succesfully invaded: " + result.args.country + "";
	                  App.notify(title,text,2500);
	                }

	                //Notification if player's country has been conquered
	                if(account == result.args.victim) {
	                  var title = "Warning!";
	                  var text =  result.args.adr + " just conquered: " + result.args.country + "";
	                  App.notify(title,text,4000);
	                }

	                if (document.getElementById('logOpen').style.display == "block") blink('#logOpen');
	                var tmp;
	                if (result.args.nick == "" || result.args.nick == undefined) tmp = result.args.adr;
	                else tmp = result.args.nick;
	                logTeam("Player: " + result.args.adr + " of " + result.args.team + " team conquered " + result.args.country, result.transactionHash,result.args.team);
	                preventMultiLogs = true;
	                avoidMultipleLogs();
	              } else {
	                console.log(error);
	              }
	            });

	            attackInflictedEvent2.watch(function(error, result){
	                App.updatePlayerInfo(false);
	                if (!error && preventMultiLogs == false) {

	                  //Notification if player is attacker
	                  if(account == result.args.adr && result.args.num.toNumber() != 0 ) {
	                    var title = "You attacked a country !";
	                    var text = "You succesfully produced a damage of: " + result.args.num.toNumber() + " to " + result.args.name;
	                    App.notify(title,text,2500);
	                  }

	                  //Notification if player is victim
	                  if(account == result.args.victim && result.args.num.toNumber() != 0) {
	                    var title = "Warning!";
	                    var text =  result.args.adr + " just inflicted you a damage of: " + result.args.num.toNumber() + " in " + result.args.name;
	                    App.notify(title,text,4000);
	                  }


	                  if (result.args.num.toNumber() == 0) {
	                    var tmp;
	                    if (result.args.nick == "" || result.args.nick == undefined) tmp = result.args.adr;
	                    else tmp = result.args.nick;
	                    logTeam(" No damage inflicted from player: " + tmp + " to " + result.args.name + ", all the armies are lost", result.transactionHash, result.args.team);
	                  }

	                  App.updateCountryInfo(result.args.name, false);

	                  if (document.getElementById('logOpen').style.display == "block") blink('#logOpen');
	                  if( result.args.num.toNumber() != 0 )logTeam("Damage of " + result.args.num + " inflicted from player: " + result.args.adr + " to " + result.args.name, result.transactionHash,result.args.team);
	                  preventMultiLogs = true;
	                  avoidMultipleLogs();
	                } else {
	                  //$("#loader").hide();
	                  console.log(error);
	                }
	            });

	      }).catch(function(err) {
	        console.log(err.message);
	      });
	    });

	    //markets
	    web3.eth.getAccounts(function(error, accounts) {

	      if (error) {
	        console.log(error);
	      }

	      //var account = accounts[0];

	      App.contracts.marketplaceContract.deployed().then(function(instance) {
	          marketplaceInstance = instance;
	          return marketplaceInstance;
	      }).then(function(result) {
	          buyEvent = marketplaceInstance.buyEvent({fromBlock:'latest'});
	      }).then(function() {

	          buyEvent.watch(function(error, result){
	            //Update owned countries count
	            App.updatePlayerInfo(false);
	            if (!error && preventMultiLogs == false) {
	              //Update Owner, Price and Army
	              App.updateCountryInfo(result.args.name, false);

	              //Notification if player is the buyer
	              if(account == result.args.adr) {
	                var title = "You bought a country !";
	                var text = "You succesfully bought: " + result.args.name;
	                App.notify(title,text,2500);
	              }

	              //Notification if player's country has been bought
	              if(account == result.args.victim) {
	                var title = "Warning!";
	                var text =  result.args.adr + " just bought from you: " + result.args.name;
	                App.notify(title,text,4000);
	              }


	              var index;
	              if(result.args.team == undefined || result == "") index = 0;
	              if(result.args.team == "BTC") index = 1;
	              if(result.args.team == "BCH") index = 2;
	              if(result.args.team == "XRP") index = 3;
	              if(result.args.team == "ETH") index = 4;
	              var number;
	              var i = 0;
	              for(const item of states) {
	                if (item == result.args.name) {
	                  number = i;
	                }
	                i++;
	              }
	              antikey = fillkeys[index];
	              new_fills = {
	                [countryId[number]] : {
	                  fillKey: antikey
	                }
	              };

	              MapData.updateChoropleth(new_fills);

	              //App.updateMapColors();

	              var color = App.pickPlayerColor(result.args.adr);
	              if (document.getElementById('logOpen').style.display == "block") blink('#logOpen');
	              var tmp;
	              if (result.args.nick == "" || result.args.nick == undefined) tmp = result.args.adr;
	              else tmp = result.args.nick;
	              logTeam("Player: " + tmp + " bought: " + result.args.name, result.transactionHash,result.args.team);
	              preventMultiLogs = true;
	              avoidMultipleLogs();
	            } else {
	              console.log(error);
	            }
	          });
	        }).catch(function(err) {
	          console.log(err.message);
	        });
	    });

	    //bombs
	    web3.eth.getAccounts(function(error, accounts) {

	      if (error) {
	        console.log(error);
	      }

	      //var account = accounts[0];

	      App.contracts.bombCards.deployed().then(function(instance) {
	          bombCardsInstance = instance;
	          return bombCardsInstance;
	      }).then(function(result) {
	          buycard = bombCardsInstance.buycard({fromBlock:'latest'});
	          cardAvailable = bombCardsInstance.cardAvailable({fromBlock:'latest'});
	      }).then(function() {

	          buycard.watch(function(error, result){
	            App.updatePlayerInfo(false);
	            //Update owned countries count
	            if (!error) {
	              //Update
	              App.updateCardsAvailability();
	              App.loadPlayerCards();
	              //Notification if player is the buyer
	              if(account == result.args.adr) {
	                var title = "You bought a card!";
	                var text = "You succesfully bought Bomb" + result.args.index;
	                App.notify(title,text,2500);
	              }

	            } else {
	              console.log(error);
	            }
	          });

	          cardAvailable.watch(function(error, result){
	            if (!error) {
	              App.loadPlayerCards();
	              App.updateCardsAvailability();
	            } else {
	              console.log(error);
	            }
	          });
	        }).catch(function(err) {
	          console.log(err.message);
	        });
	    });
	*/
  	}
	signup(team, nick) {

	    var cryskInstance;
	    var resolve = this;

	    web3.eth.getAccounts(function(error, accounts) {

	      if (error) {
	      console.log(error);
	      }

	      //var account = accounts[0];

	      cryskInstance = contracts.Crysk.methods;
          on("loadingModalContainer");
          cryskInstance.signUp(team, nick).send({from: account}).then(function(result) {
          if(result.status == true) {
            $('#myModal').modal('hide');
            resolve.updatePlayerInfo(false);
          }
	        return result;
	      }).catch(function(err) {
	        resolve.notify("An error occurred while signin up", "Check MetaMask transaction and try again. Error: "+err+"",3000);
	        off("loadingModalContainer");
	        console.log(err.message);
	      });

	    });
  	}
};

var fills = {
    defaultFill: defaultColor, // Any hex, color name or rgb/rgba value Index 0
    BTCFill: btcColor,//red yellow index 1
    BCHFill: bchColor,//green index 2
    XRPFill: xrpColor,//yellow index 3
    ETHFill: ethColor// blue index 4
};

//ZOOM AND PAN FUNCTIONALITIES
{
  function Zoom(args) {
        $.extend(this, {
          scale:      args.cScale,
          $container: args.$container,
          datamap:    args.datamap
        });

        this.init();
  };
  Zoom.prototype.init = function() {
        var paths = this.datamap.svg.selectAll("path"),
            subunits = this.datamap.svg.selectAll(".datamaps-subunit");

        // preserve stroke thickness
        paths.style("vector-effect", "non-scaling-stroke");

        // disable click on drag end
        subunits.call(
          d3.behavior.drag().on("dragend", function() {
            d3.event.sourceEvent.stopPropagation();
          })
        );

        this.scale.set = this._getScalesArray();
        this.d3Zoom = d3.behavior.zoom().scaleExtent([ 1, this.scale.max ]);
        this._update(currentZoomTranslate, currentZoomScale);
        this.listen();
  };
  Zoom.prototype.listen = function() {

        this.datamap.svg
          .call(this.d3Zoom.on("zoom", this._handleScroll.bind(this)))
          .on("dblclick.zoom", null); // disable zoom on double-click
  };
  Zoom.prototype._handleScroll = function() {
  		currentCircleScaleTransform = $('#fakeOcean').attr('transform');
  		currentScaleTransform = $('.datamaps-subunits').attr('transform');

        var translate = d3.event.translate,
            scale = d3.event.scale,
            currentScale = scale,
            limited = this._bound(translate, scale);

        currentZoomTranslate = limited.translate;
        currentZoomScale = limited.scale;

        //limited.translate[0]+=55; THIS IS TO ENABLE MOBILE ZOOM

        this.scrolled = true;
        //Remove if statement if want to enable mobile zoom
        if(screen.width > 500) {this._update(limited.translate, limited.scale/*-0.3*/);}
        scale = [limited.translate, limited.scale];
  };
  Zoom.prototype._bound = function(translate, scale) {
        var width = this.$container.width(),
            height = this.$container.innerHeight();

        translate[0] = Math.min(
          (width / height)  * (scale - 1),
          Math.max( width * (1 - scale), translate[0] )
        );

        translate[1] = Math.min(0, Math.max(height * (1 - scale), translate[1]));
        //Remove second if statement if want to enable mobile zoom
        if(document.getElementById('fakeOcean') && screen.width > 500)document.getElementById('fakeOcean').setAttribute('transform', "translate("+translate[0]+","+translate[1]+") scale("+scale+")");

        return { translate: translate, scale: scale };
  };
  Zoom.prototype._update = function(translate, scale) {

        this.d3Zoom
          .translate(translate)
          .scale(scale);

        this.datamap.svg.selectAll("g")
          .attr("transform", "translate(" + translate + ")scale(" + scale + ")");
  };
  Zoom.prototype._animate = function(translate, scale) {
      var _this = this,
      d3Zoom = this.d3Zoom;

      d3.transition().duration(350).tween("zoom", function() {
        var iTranslate = d3.interpolate(d3Zoom.translate(), translate),
        iScale = d3.interpolate(d3Zoom.scale(), scale);
        return function(t) {
          _this._update(iTranslate(t), iScale(t));
        };
      });
  };
  Zoom.prototype._getScalesArray = function() {
        var array = [],
            scaleMaxLog = Math.log(this.scale.max);

        for (var i = 0; i <= 10; i++) {
          array.push(Math.pow(Math.E, 0.1 * i * scaleMaxLog));
        }

        return array;
  };
}

var globalRotation = [90,-30];

function init3D() {
    d3.select("#div").html('');
    document.getElementById('div').style.maxWidth= '100%';
    document.getElementById('div').style.height = '76rem';
    document.getElementById('div').style.marginTop = '-5rem';
    if(screen.width < 500) {
  		currentZoomTranslate = [55,0];
		currentZoomScale = 0.7;
		document.getElementById('mobileMenu').style.display = 'block'
  	}
    draw3D();
}
function draw3D() {

  var container = $("#div");
  var tmp = this;
  fills.defaultFill = 'rgb(77, 77, 77)';

  map = new Datamap({//need global var
    scope: 'world',
    element: document.getElementById('div'),
    projection: 'orthographic',
    projectionConfig: {
      rotation: globalRotation
    },
    fills: fills,
    geographyConfig: {
      responsive: true,
      popupTemplate: function (geography, data) {
        return '<div class="hoverinfo text-white bg-dark">' + geography.properties.name + '</div>';
      },
      borderColor: MapborderColor,
      highlightFillColor: MaphighlightFillColor,
      highlightBorderColor: MaphighlightBorderColor,
      borderWidth: 0.8
    },
    done: function(datamap) {
      MapData = datamap;
      tmp.zoom = new Zoom({
        $container: container,
        datamap: datamap,
        cScale: currentScale,
      });
      $('.datamaps-subunits').attr('transform', currentScaleTransform);
      $('#fakeOcean').attr('transform', currentScaleTransform);
    }
  });
  map.svg.selectAll('.datamaps-subunit').on('click', function(geography) {
    App.showDiv(geography.properties.name);
    selected = geography;
    state_id = geography.id;
    fillkeys = Object.keys(fills);
    $("#popUp2").fadeIn("done", function() {countryOnOff = true;});
  });

  //var mapSVG = $('#div').children();
  map.updateChoropleth();
  //draw a legend for this map
  //map.graticule();

  var drag = d3.behavior.drag()
  .on('drag', function() {


    on('loadingContainer');
    var dx = d3.event.dx;
    var dy = d3.event.dy;

    // var rotation = livemapScope.rotation;
    var rotation = map.projection.rotate();
    var radius = map.projection.scale();
    var scale = d3.scale.linear()
      .domain([-1 * radius, radius])
      .range([-90, 90]);
    var degX = scale(dx);
    var degY = scale(dy);
    rotation[0] += degX;
    rotation[1] -= degY;
    if (rotation[1] > 90) rotation[1] = 90;
    if (rotation[1] < -90) rotation[1] = -90;

    if (rotation[0] >= 180) rotation[0] -= 360;
    globalRotation = rotation;
    init3D();
    //map.updateChoropleth();
    //map.svg.selectAll('.datamaps-subunit').attr('transform', currentScaleTransform);
    //$('#svgDiv').attr('transform', currentScaleTransform);

  })
  .on('dragend', function() {
    //map.updateChoropleth();
    off('loadingContainer');
  });
  d3.select("#div").select("svg").call(drag);

  fills.defaultFill = defaultColor;
  if(currentCircleScaleTransform == undefined) currentCircleScaleTransform = "";
  $("#div").prepend('<svg style=" height:100%; width:100%" ><defs><radialGradient id="grad1" gradientUnits="userSpaceOnUse"><stop offset="0%" style="stop-color:hsl(199, 90%,25%); "/><stop offset="60%" style="stop-color:hsl(199, 90%,65%); "/><stop offset="100%" style="stop-color:hsl(199, 90%, 90%); "/></radialGradient></defs><circle id="fakeOcean" transform="'+currentCircleScaleTransform+'" cx="60rem" cy="42.22rem" r="15.7rem" stroke="black" stroke-width="3" style="fill:url(#grad1);"">');
  $("#div").append('</circle></svg>');
}
function init2D () {
  d3.select("#div").html('');
  document.getElementById('div').style.maxWidth = '75%';
  document.getElementById('div').style.height= '73rem';
  document.getElementById('div').style.marginTop = '0rem';
  draw2D();
}
function draw2D() {

  this.$container = $("#div");
  var tmp = this;
  map = new Datamaps({
    scope: 'world',
    responsive: true,
    element: this.$container.get(0),
    projection: 'mercator',
    aspectRatio: 0.59,
    done: function(datamap) {
      MapData = datamap;
      tmp.zoom = new Zoom({
        $container: tmp.$container,
        datamap: datamap,
        cScale: currentScale,
      });
    },
    fills: fills,
    geographyConfig: {
      popupTemplate: function (geography, data) {
        return '<div class="hoverinfo text-white bg-dark">' + geography.properties.name + '</div>';
      },
      borderColor: MapborderColor,
      highlightFillColor: MaphighlightFillColor,
      highlightBorderColor: MaphighlightBorderColor
    },
  });
  view2d = true;
  map.svg.selectAll('.datamaps-subunit').on('click', function(geography) {
    App.showDiv(geography.properties.name);
    selected = geography;
    state_id = geography.id;
    fillkeys = Object.keys(fills);
    $("#popUp2").fadeIn("done", function() {countryOnOff = true;});
  });
}

//On document ready listen for click of elements outside menus
$(document).ready(function() {

  // Autoclose menu when clicking outside
  document.body.onclick = function(e){

    if(
        e.target.id != 'Countrycard' &&
        e.target.className != "custom-select" &&
        e.target.className != "card-body" &&
        e.target.className != "card-body text-white" &&
        e.target.className != "multi-line-button card-text" &&
        e.target.className != "card-text breakText" &&
        e.target.className != "card-text col" &&
        e.target.className != "btn btn-outline-secondary text-white multi-line-button" &&
        e.target.className != "btn multi-line-button text-secondary" &&
        e.target.className != "multi-line-button btn btn-light col-2" &&
        e.target.className != "multi-line-button btn btn-light col" &&
        e.target.className != "fas fa-angle-double-up" &&
        e.target.className != "card-text" &&
        e.target.className != "card-title" &&
        e.target.className != "btn" &&
        e.target.className != "logs" &&
        e.target.className != "form-control"
      ) {

      if (countryOnOff == true) {
        $("#popUp2").fadeOut("done", function() {
          document.getElementById('popUp2').style.display = "none";
          off("Attack");
          off("attackingInput");
          off("Buy");
          off("bombcardsBtn");
          document.getElementById("Countrycard").style.height = '30vh';
          if(screen.width < 500) document.getElementById("Countrycard").style.height = '16rem';
          countryOnOff = false;
        });
      }
      else if (playerOnOff == true) {
        $("#popUp").fadeOut("done", function() {
          document.getElementById('popUp').style.display = "none";
          playerOnOff = false;
        });

      }
      else if (logOnOff == true) {
        off('list');
        on('logOpen');
        logOnOff = false;
      }
      else if(otherplayerOnOff == true) {

        $("#popUp3").fadeOut();
        otherplayerOnOff = false;
      }
      else if(settingsOnOff == true) {
        $("#popUp4").fadeOut();
        settingsOnOff = false;
      }
      else if(marketOnOff == true) {
        $("#popUp5").fadeOut();
        marketOnOff = false;
      }
      else if(ownedCountriesOnOff == true) {
        $("#popUp6").fadeOut();
        ownedCountriesOnOff = false;
      }
      else if(mobileMenuOnOff == true) {
      	$("#popUp7").fadeOut();
      	mobileMenuOnOff = false;
      }
      else return;
    }
  };
});

//ON LOAD WINDOW !!!!!!!!!!!!!!!
$(window).load(function() {

  view2d = false;
  App = new App();
  //Press globalView button
  selectedView = 'globalview';
  var initView = $('#'+selectedView+'').closest('.btn');
  initView.removeClass('btn-dark');
  initView.addClass('btn-light');
  App.calculateViews();

  $('#loginModal').modal({
    backdrop: 'static',
    keyboard: false
  });

  $("#login").on('click', function() {
    $('#loginModal').modal('hide');
    var pubKey = JSON.parse("[" + document.getElementById('publicKey').value + "]");
    var privKey = JSON.parse("[" + document.getElementById('privateKey').value + "]");
    run(pubKey,privKey);
  });

  $("#createAccount").on('click', function() {
    App.init(0,0);
  });


});

async function run(pubkey,privkey) {

	//Init App
    await App.init(pubkey,privkey);

	//Initialize map colors
  	setTimeout(function(){
	    var i = 0;
	    fillkeys = Object.keys(fills);
	    for(const item of states) {
	      App.pickColor(item,i,true);
	      i++;
	    }
  	}, 1000);

	setTimeout(function() {
	    App.updatePlayerInfo(false);
	    App.listenToEvents();
	}, 3000);

    //Change team from iniial modal (it will close the modal)
    $('#dialogPlay').on('click', function() {
	    var cryskInstance;
	    var input = document.getElementById("inputGroupSelect2");
	    var team;
	    if(input.selectedIndex == 0 ) team = 'BTC';
	    if(input.selectedIndex == 1 ) team = 'BCH';
	    if(input.selectedIndex == 2 ) team = 'ETH';
	    if(input.selectedIndex == 3 ) team = 'XRP';

	    var nick = document.getElementById('initialNickname').value;
	    App.signup(team,nick);
    });

    //Open/Close Player menu
    $("#menuToggle").on('click', function() {
	    if (document.getElementById("popUp").style.display == "block") {
	      return} else {
	      $("#popUp").fadeIn("done", function() {playerOnOff = true;});
	      document.getElementById("popUp").style.display = "block";
	    }
    });

    $("#settingsToggle").on('click', function() {
	    if (document.getElementById("popUp4").style.display == "block") {
	      return} else {
	        $("#popUp4").fadeIn("done", function() {settingsOnOff = true;});
	        document.getElementById("popUp4").style.display = "block";
	      }
    });

    $("#mobileSettings").on('click', function() {
	    if (document.getElementById("popUp7").style.display == "block") {
	      return} else {
	        $("#popUp7").fadeIn("done", function() {mobileMenuOnOff = true;});
	        document.getElementById("popUp7").style.display = "block";
	      }
    });

    $("#marketToggle").on('click', function() {
	    if (document.getElementById("popUp5").style.display == "block") {
	      return} else {
	        $("#popUp5").fadeIn("done", function() {marketOnOff = true;});
	        document.getElementById("popUp5").style.display = "block";
	      }
    });

    $("#ownedCountryToggle").on('click', function() {
	    if (document.getElementById("popUp6").style.display == "block") {
	      return} else {
	        $("#popUp2").fadeOut("done", function() {countryOnOff = false;});
	        $("#popUp6").fadeIn("done", function() {ownedCountriesOnOff = true;});
	        document.getElementById("popUp6").style.display = "block";
	      }
    });

    //On click to logToggle
    $('#logOpen').on('click', function() {
	    off('logOpen');
	    on('list');
	    logOnOff = true;
    });

    //On change nickname
    $('#changeNick').on('click', function() {
	    var nick = document.getElementById('nickname').value;
	    App.setNickName(nick);
    });

    $('#viewSwitcher').on('click', function() {
	    if(view2d == true) {
	      view2d = false;
	      $('#div').removeAttr('style');
	      init3D();
    	}
    	else {
        	init2D();
        	view2d = true;
    	}
    })

    //App.refreshData();

    //In on mouse hover changed the color after the first load of colors then repaint again to avoid losing colors
    setTimeout(function() {App.updateMapColors();}, 5000);

    map.resize();
}

//Print logs in the log window
function logTeam(str, hash, team){
    var node = document.createElement("p");
    node.setAttribute("id", "logLine");
    if(team == undefined) node.setAttribute("style", "background-color: rgba(80,80,80,0.4);");
    if(team == "BTC") node.setAttribute("style", "background-color: rgba(255, 51, 51,0.6);");
    if(team == "BCH") node.setAttribute("style", "background-color: rgba(77, 255, 77,0.6);");
    if(team == "ETH") node.setAttribute("style", "background-color: rgba(26, 117, 255,0.6);");
    if(team == "XRP") node.setAttribute("style", "background-color: rgba(255, 255, 26,0.6);");

    node.setAttribute("class", "text-dark thick");
    node.appendChild(document.createTextNode(str));
    document.getElementById("list").insertBefore(node, document.getElementById("list").firstChild );
    var url = "https://ropsten.etherscan.io/tx/"+hash+"";
    $("#logLine").on('click', function () {
      window.open(url, "_blank");
    });
    //document.getElementById("list").appendChild(node);
}

//Utilities
function on(name) {

  if(document.getElementById(name).style.display = "none" || document.getElementById(name).style.display == undefined) {
    document.getElementById(name).style.display = "block";
  }
}

function off(name) {
  if(document.getElementById(name).style.display = "block" || document.getElementById(name).style.display == undefined) {
    document.getElementById(name).style.display = "none";
  }
}

function blink(selector){
  $(selector).fadeOut('slow');
  $(selector).fadeIn('slow');
}

function showCards() {
  if(!$('#drop1').hasClass('hide')) $('#drop1').addClass('hide');
  if(!$('#drop2').hasClass('hide')) $('#drop2').addClass('hide');
  if(!$('#drop3').hasClass('hide')) $('#drop3').addClass('hide');
  $('#cardsModalCenter').modal('show');
}

function showCardsActive(){
  if($('#drop1').hasClass('hide')) $('#drop1').removeClass('hide');
  if($('#drop2').hasClass('hide')) $('#drop2').removeClass('hide');
  if($('#drop3').hasClass('hide')) $('#drop3').removeClass('hide');
  $('#cardsModalCenter').modal('show');
}

function blinkBackground(color) {
  var $blinkElems = $('[data-blink]'); // store reference
  var i = 0;
  var handler = setInterval(function(){
    $blinkElems.toggleClass(''+color+'');
    i++;
    if(i == 6) clearInterval(handler);
  },600)
}

function avoidMultipleLogs() {

  setInterval(function() {preventMultiLogs = false;}, 2000);
}

function updateUi (color) {
  document.getElementById('playerMenuColor').style.color = color;
  document.getElementById('logMenuColor').style.color = color;
  document.getElementById('yoursview').style.color = color;
  document.getElementById('settingsColor').style.color = color;
  document.getElementById('settingsToggle').style.border = "2px solid "+color+"";
  document.getElementById('cardsBarsButton').style.border = "2px solid "+color+"";
  document.getElementById('cardsMenuColor').style.color = color;
  document.getElementById('marketMenuColor').style.color = color;
  document.getElementById('ownedcountryColor').style.color = color;
  document.getElementById('fullScreenButton').style.backgroundColor = color;
  if(view2d == false) document.getElementById('sliderColor').style.background = color;
  rgb = color;
  playerColor = color;
  document.getElementById('BTCoption').setAttribute("style", 'background-color: '+btcColor+'');
  document.getElementById('BCHoption').setAttribute("style", 'background-color: '+bchColor+'');
  document.getElementById('ETHoption').setAttribute("style", 'background-color: '+ethColor+'');
  document.getElementById('XRPoption').setAttribute("style", 'background-color: '+xrpColor+'');
}

//To activate on mobile
function toggleFullScreen() {
  if ((document.fullScreenElement && document.fullScreenElement !== null) ||
   (!document.mozFullScreen && !document.webkitIsFullScreen)) {
    if (document.documentElement.requestFullScreen) {
      document.documentElement.requestFullScreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullScreen) {
      document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
    }
    document.body.style.backgroundColor = 'rgb(0,15,30)';
    //Move Up and repaint Backgroun color
  } else {
    if (document.cancelFullScreen) {
      document.cancelFullScreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitCancelFullScreen) {
      document.webkitCancelFullScreen();
    }
  	//Move down a little
  }
}
