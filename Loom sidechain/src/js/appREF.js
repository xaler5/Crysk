var map;
var account;
var MapData;
var fillkeys;
var antikey;
var new_fills;
var states = [];
var countryId = [];
var selected;
var state_id;
var countryOnOff;
var playerOnOff;
var logOnOff;


//Colors
var btcColor = 'rgb(255, 51, 51)'; 
var bchColor = 'rgb(77, 255, 77)';
var ethColor = 'rgb(26, 117, 255)';
var xrpColor = 'rgb(255, 255, 26)';
var defaultColor = 'rgba(140, 140, 140, 0.5)';
var MapborderColor = 'rgba(180,180,180,0.3)';
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

//APP
App = {

  web3Provider: null,
  contracts: {},

  init: function() {
    var countries = Datamap.prototype.worldTopo.objects.world.geometries;
    for (var i = 0, j = countries.length; i < j; i++) {
      states[i] = countries[i].properties.name;
      countryId[i] = countries[i].id;
    }
    return App.initWeb3();
  },

  initWeb3: function() {
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fall back to Ganache
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function() {
    //Crysk
    $.getJSON('Crysk.json', function(data) {
    var cryskArtifact = data;
    App.contracts.Crysk = TruffleContract(cryskArtifact);
    

    // Set the provider for our contract
    App.contracts.Crysk.setProvider(App.web3Provider);
    })
    
    //Attack 
    $.getJSON('attacksContract.json', function(data) {
    var attacksArtifact = data;
    App.contracts.attacksContract = TruffleContract(attacksArtifact);
    

    // Set the provider for our contract
    App.contracts.attacksContract.setProvider(App.web3Provider);
    })

    //Countries 
    $.getJSON('countriesContract.json', function(data) {
    var countriesArtifact = data;
    App.contracts.countriesContract = TruffleContract(countriesArtifact);
    

    // Set the provider for our contract
    App.contracts.countriesContract.setProvider(App.web3Provider);
    })

    //Market 
    $.getJSON('marketplaceContract.json', function(data) {
    var marketplaceArtifact = data;
    App.contracts.marketplaceContract = TruffleContract(marketplaceArtifact);
    

    // Set the provider for our contract
    App.contracts.marketplaceContract.setProvider(App.web3Provider);
    })

    //Players
    $.getJSON('playersContract.json', function(data) {
    var playersArtifact = data;
    App.contracts.playersContract = TruffleContract(playersArtifact);
    

    // Set the provider for our contract
    App.contracts.playersContract.setProvider(App.web3Provider);
    })
  },

  setPlayer: function() {
    
    web3.eth.getAccounts(function(error, accounts) {
  
      var accountInterval = setInterval(function() {
        
        if (web3.eth.accounts[0] !== account && account != undefined) {
          location.reload(true);
        }
        
        if (account == undefined && web3.eth.accounts[0] !== account) {
          on("loadingContainer");
          account = web3.eth.accounts[0];
          //App.updatePlayerInfo(false);
        }
      }, 100);
    });
  },

  setNickName: function (name) {
    web3.eth.getAccounts(function(error, accounts) {

      if (error) {
        console.log(error);
      }

      var account = accounts[0];
      App.contracts.Crysk.deployed().then(function(instance) {
        cryskInstance = instance;
        return cryskInstance.changeNickName(name);
      }).then(function(result) {
        App.notify("Your nickname will be changed in a while", "Next time you will join in it will be displayed");
        }).catch(function(err) {
          App.notify("An error occurred while changing nickname", err);
          //console.log(err.message);
        });
      
      });
  },

  changeView: function(name) {

    //Mark button as pressed and deselect the previous one
    var parentOld = $('#'+selectedView+'').closest('.btn');
    parentOld.removeClass('btn-light');
    parentOld.addClass('btn-dark');
    if(selectedView == "globalview") {
      parentOld.removeClass('text-dark');
      parentOld.addClass('text-white');
    }
    selectedView = name;
    var parentNew = $('#'+selectedView+'').closest('.btn');
    if(selectedView == "globalview") {
      parentNew.removeClass('text-white');
      parentNew.addClass('text-dark');
    }
    parentNew.removeClass('btn-dark');
    parentNew.addClass('btn-light');


    App.calculateViews();
  },

  calculateViews: function() {
    //RE-DO THE MAP
    function Datamap() {
      var tmp = this;
      this.$container = $("#div");
      this.instance = new Datamaps({
        scope: 'world',
        responsive: true,
        element: this.$container.get(0),
        projection: 'mercator',
        aspectRatio: 0.625,
        done: function(datamap) {
          MapData = datamap;
          tmp.zoom = new Zoom({
            $container: tmp.$container,
            datamap: datamap
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
    };
    $('#div').empty();
 
    map = new Datamap();
    map.instance.svg.selectAll('.datamaps-subunit').on('click', function(geography) {
      App.showDiv(geography.properties.name); 
      selected = geography;
      state_id = geography.id;
      fillkeys = Object.keys(fills);
      $("#popUp2").fadeIn("done", function() {countryOnOff = true;});
    });

    var i = 0;
    for(const item of states) {
      App.pickColor(item,i,false);
      i++;  
    }
  },

  pickColor: function (item,int,init) {
    var index;
    var player;
    var cryskInstance;

    var name = item;
    var number = int;  
      
    web3.eth.getAccounts(function(error, accounts) {

        if (error) {
        console.log(error);
        }

        var account = accounts[0];

        App.contracts.Crysk.deployed().then(function(instance) {
          cryskInstance = instance;
          if(name) return cryskInstance.getOwner(name, {from: account});
          else return;
        }).then(function(result) {
          if(result == undefined) result = 0;
          player = result;
          return cryskInstance.getPlayerTeam(player, {from: account});
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
  },

  updatePlayerInfo: function(bool) {

    var cryskInstance;
    var experience;
    var level;
    var team;
    var ownedcountries;
    var army;
    var bombs;
    var rgb;

    web3.eth.getAccounts(function(error, accounts) {
      
        if (error) {
        console.log(error);
        }

        var account = accounts[0];
        
        App.contracts.Crysk.deployed().then(function(instance) {
          cryskInstance = instance;
          return cryskInstance.getPlayerExpPts(account, {from: account});
        }).then(function(result) {
          experience = result.toNumber();
          document.getElementById('exp').innerHTML = "Experience: " + experience;
          return experience;
        }).then(function(instance) {
          
          return cryskInstance.getPlayerLvl(account, {from: account});
        }).then(function(result) {
          level = result.toNumber();
          document.getElementById('lvl').innerHTML = "Level: " + level ;
          return level;
        }).then(function(instance) {
          return cryskInstance.getPlayerTeam(account, {from: account});
        }).then(function(result) {
          team = result;
          //PERSONALIZE UI WITH THE CORRESPONDING COLOR

          //If one wants to change also the menu color
          /*
            //document.getElementById('PlayerCard').classList.add('text-white');
            //document.getElementById('PlayerCard').classList.remove('text-dark');
            //document.getElementById('buyarmies').classList.add('text-white');
            //document.getElementById('buyarmies').classList.remove('text-dark');
            //document.getElementById('buybombs').classList.add('text-white');
            //document.getElementById('buybombs').classList.remove('text-dark');
            //document.getElementById('changeTeamButton').classList.add('text-white');
            //document.getElementById('changeTeamButton').classList.remove('text-dark');
            //document.getElementById('PlayerCard').style.background ="rgba(COLOR,0.8)";
            //document.getElementById('Countrycard').style.background ="rgba(COLOR,0.8)";
          */
          if(result == "BTC") {
            document.getElementById('titleColor').style.color = btcColor;
            document.getElementById('playerMenuColor').style.color = btcColor;
            document.getElementById('menuToggle').style.border = "2px solid "+btcColor+"";
            document.getElementById('logMenuColor').style.color = btcColor;
            document.getElementById('zoomButton0').style.color = btcColor;
            document.getElementById('zoomButtonMinus').style.color = btcColor;
            document.getElementById('zoomButtonPlus').style.color = btcColor;
            document.getElementById('yoursview').style.color = btcColor;
            rgb = btcColor;
            playerColor = btcColor;
          }
          if(result == "BCH") {
            document.getElementById('titleColor').style.color = bchColor;
            document.getElementById('playerMenuColor').style.color = bchColor;
            document.getElementById('menuToggle').style.border = "2px solid "+bchColor+"";
            document.getElementById('logMenuColor').style.color = bchColor;
            document.getElementById('zoomButton0').style.color = bchColor;
            document.getElementById('zoomButtonMinus').style.color = bchColor;
            document.getElementById('zoomButtonPlus').style.color = bchColor;
            document.getElementById('yoursview').style.color = bchColor;
            rgb = bchColor;
            playerColor = bchColor;
          }
          if(result == "XRP") {
            document.getElementById('titleColor').style.color = xrpColor;
            document.getElementById('playerMenuColor').style.color = xrpColor;
            document.getElementById('menuToggle').style.border = "2px solid "+xrpColor+"";
            document.getElementById('logMenuColor').style.color = xrpColor;
            document.getElementById('zoomButton0').style.color = xrpColor;
            document.getElementById('zoomButtonMinus').style.color = xrpColor;
            document.getElementById('zoomButtonPlus').style.color = xrpColor;
            document.getElementById('yoursview').style.color = xrpColor;
            playerColor = xrpColor;
            rgb = xrpColor;
          }
          if(result == "ETH") {
            document.getElementById('titleColor').style.color = ethColor;
            document.getElementById('playerMenuColor').style.color = ethColor;
            document.getElementById('menuToggle').style.border = "2px solid "+ethColor+"";
            document.getElementById('logMenuColor').style.color = ethColor;
            document.getElementById('zoomButton0').style.color = ethColor;
            document.getElementById('zoomButtonMinus').style.color = ethColor;
            document.getElementById('zoomButtonPlus').style.color = ethColor;
            document.getElementById('yoursview').style.color = ethColor;
            playerColor = ethColor;
            rgb = ethColor;
          }
          document.getElementById('team').innerHTML = "Team: " + team ;
          return team;
        }).then(function(instance) {
          return cryskInstance.getTotalOwned(account, {from: account});
        }).then(function(result) {
          ownedcountries = result.toNumber();
          document.getElementById('owncntrs').innerHTML = "Owned countries: " + ownedcountries ;
          return ownedcountries;
        }).then(function(instance) {
          return cryskInstance.getAvailableArmy(account, {from: account});
        }).then(function(result) {
          army = result.toNumber();
          if (army == undefined) army = 0;
          document.getElementById('army').innerHTML = "Armies: " + army;
          return army;
        }).then(function(instance) {
          return cryskInstance.getAvailableBombs(account, {from: account});
        }).then(function(result) {
          bombs = result.toNumber();
          if (bombs == undefined) bombs = 0;
          document.getElementById('bombs').innerHTML = "Bombs: " + bombs + " to drop" ;
          return cryskInstance.getPlayerNickname(account, {from: account});
        }).then(function(result) {
          var nick = result;
          if (nick == "") return;
          else document.getElementById('nick').innerHTML =  "<font style='color: " +rgb +";'>" + nick + "</font>";
          return nick;
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
  },

  updateCountryInfo: function(name, bool) {

    var cryskInstance;
    var owner;
    var lifepoints;
    var rgb;

    web3.eth.getAccounts(function(error, accounts) {
      
      if (error) {
      console.log(error);
      }

      var account = accounts[0];
      
      App.contracts.Crysk.deployed().then(function(instance) {
        cryskInstance = instance;
        return cryskInstance.getPrice(name, {from: account});
      }).then(function(result) {
        var price = result.toNumber();
        if( name == selected.properties.name ) document.getElementById('Price').innerHTML = 'Price: ' + price/1000000000000000000 + " Eth" ; //CHECK ZEROES ARE CORRECT
        return price;
      }).then(function() {
        return cryskInstance.getArmy(name, {from: account});
      }).then(function(result) {
        var army = result.toNumber();
        if( name == selected.properties.name ) document.getElementById('Army').innerHTML = 'Defending armies: ' + army ;
        return cryskInstance.getLifePoints(name, {from: account});
      }).then(function(result) {
        lifepoints = result.toNumber();
        if( name == selected.properties.name ) document.getElementById('LifePts').innerHTML = 'LifePts: ' + lifepoints ;
        return cryskInstance.getOwner(name, {from: account});
      }).then(function(result) {
        owner = result;
        if (owner == account) {
          off("bombing");
          off("Attack");
          off("attackingInput");
          off("Buy");
          on("defending");
          on("defendingInput");
        }
        if (owner != undefined && owner != account && owner != 0x0000000000000000000000000000000000000000) {
          off("defending");
          off("defendingInput");
          on("Attack");
          on("attackingInput");
          on("bombing");
          on("Buy");
        }
        if (owner == 0x0000000000000000000000000000000000000000 ) {
          off("defending");
          off("defendingInput");
          on("Buy");
          off("bombing");
          off("Attack");
          off("attackingInput");
          if( name == selected.properties.name ) document.getElementById('Owner').innerHTML = 'There is no owner here, buy it!';
        }
        return cryskInstance.getPlayerTeam(owner, {from: account});
      }).then(function(result) {
        if (result == "BTC") rgb = btcColor; 
        if (result == "BCH") rgb = bchColor;
        if (result == "ETH") rgb = ethColor;
        if (result == "XRP") rgb = xrpColor;
        return cryskInstance.getPlayerNickname(owner, {from: account});
      }).then(function(result) {
        if(result == "" && owner != 0x0000000000000000000000000000000000000000) document.getElementById('Owner').innerHTML = 'Owner: ' + owner ;
        if(result != "" && owner != 0x0000000000000000000000000000000000000000) document.getElementById('Owner').innerHTML = 'Owner: <a href="#" style="color: '+rgb+';" data-toggle="tooltip" title="'+ owner +'">'+ result +'</a>';
      }).then(function(){
          if(bool != true) off("loadingContainer");
        }).catch(function(err) {
        console.log(err.message);
      });

    });
  },

  showDiv: function(name) {

    document.getElementById('selectedState').innerHTML = 'Country:' + ' ' + name;
    
    App.updateCountryInfo(name, false);
  },

  updateMapColors: function() {
    var i = 0;
    for(const item of states) {
      App.pickColor(item,i,true);
      i++;  
    }
  },

  invade: function() {
    var objectId = selected.properties.iso;
    var objectName = selected.properties.name;
    var quantity = document.getElementById('attackingInput').value;;

    web3.eth.getAccounts(function(error, accounts) {

      if (error) {
      console.log(error);
      }

      var account = accounts[0];

      App.contracts.Crysk.deployed().then(function(instance) {
        cryskInstance = instance;
        return cryskInstance.getLockStatus(objectName);
      }).then(function(result) {
        if (result == false) return cryskInstance.itExists(objectName, {from: account});
        else {
          App.notify("Try again", "An action on this country is taking place");
          console.logBase("An action on this country is taking place, try again");
        }
      }).then(function(result) {
        if(result == true) return cryskInstance.getOwner(objectName, {from: account} );
        //Consider showing a div with the error
        else {
          App.notify("You can't attack a virgin land", "You can still buy it!");
          console.logBase("You can't attack a virgin land. You can still buy it!"); 
        }
      }).then(function (result) {
        if(result != account) return cryskInstance.getAvailableArmy(account, {from: account})
        else {
          App.notify("You own this country!", "avoid damaging yourself");
          console.logBase("You own this country! avoid damaging yourself"); 
        }
      }).then(function(result) {
          $("#popUp2").fadeOut("done", function() {
            countryOnOff = false;
          });
        if (result.toNumber() >= quantity) return cryskInstance.attack(objectName, quantity, {from: account, gas:200000});
        else {
          App.notify("Error", "You don't have this number of armies");
          console.logBase("You don't have this number of armies");
          return false;
        }
        }).then(function(result){
        if(result != false)  on("loadingContainer");
          return result;
        }).catch(function(err) {
        App.notify("An error occurred while attacking" +objectName+"", "Check MetaMask transaction and try again. Error: "+err+"");
        //console.log(err.message);
      });

    });
  },

  addSoldiers: function() {
    var amount = document.getElementById('defendingInput').value;
    var objectId = selected.properties.iso;
    var objectName = selected.properties.name;

    web3.eth.getAccounts(function(error, accounts) {

      if (error) {
      console.log(error);
      }

      var account = accounts[0];

      App.contracts.Crysk.deployed().then(function(instance) {
        cryskInstance = instance;
        return cryskInstance.getLockStatus(objectName);
      }).then(function(result) {
        if (result == false) return cryskInstance.itExists(objectName, {from: account});
        else {
          App.notify("Try again", "An action on this country is taking place");
          console.logBase("An action on this country is taking place, try again");
        }
      }).then(function(result) {
        if(result == true) return cryskInstance.getOwner(objectName, {from: account});
        //Consider showing a div with the error
        else {
          App.notify("You can't add soldiers in a virgin land","You can still buy it!");
          console.logBase("You can't add soldiers in a virgin land","You can still buy it!");
        }
      }).then(function(result) {
          if(result == account) return cryskInstance.getAvailableArmy(account, {from: account}); 
          else {
            App.notify("Error", "You don't own this country!");
            console.logBase("You don't own this country!"); 
          }
        }).then(function(result) {
          $("#popUp2").fadeOut("done", function() {countryOnOff = false;});
          if( amount <= result.toNumber() ) return cryskInstance.addArmyInState(amount, objectName, {from: account});
          else {
            console.logBase("You don't have enough armies to place!")
            App.notify("Error","You don't have enough armies to place!")
            return false;
          }
        }).then(function(result){
          if (result != false) on("loadingContainer");
          return result;
        }).catch(function(err) {
        App.notify("An error occurred while adding armies to" +objectName+"", "Check MetaMask transaction and try again. Error: "+err+"");
        //console.log(err.message);
      });

    });
  },

  subSoldiers: function() {
    var amount = document.getElementById('defendingInput').value;
    var objectId = selected.properties.iso;
    var objectName = selected.properties.name;

    web3.eth.getAccounts(function(error, accounts) {

      if (error) {
      console.log(error);
      }

      var account = accounts[0];

      App.contracts.Crysk.deployed().then(function(instance) {
        cryskInstance = instance;
        return cryskInstance.getLockStatus(objectName);
      }).then(function(result) {
        if (result == false) return cryskInstance.itExists(objectName, {from: account});
        else {
          App.notify("Try again", "An action on this country is taking place");
          console.logBase("An action on this country is taking place, try again");
        }
      }).then(function(result) {
        if(result == true) return cryskInstance.getOwner(objectName, {from: account});
        //Consider showing a div with the error
        else {
          App.notify("You can't take soldiers from a virgin land", "You can still buy it!");
          console.logBase("You can't take soldiers from a virgin land. You can still buy it!"); 
        }
      }).then(function(result) {
          if(result == account) return cryskInstance.getArmy(account, {from: account}); 
          else {
            App.notify("Error","You don't own this country!");
            console.logBase("You don't own this country!"); 
          }
        }).then(function(result) {
          $("#popUp2").fadeOut("done", function() {countryOnOff = false;});
          if( amount <= result.toNumber() ) return cryskInstance.subArmyFromState(amount, objectName, {from: account});
          else {
            console.logBase("You don't have enough armies to withdraw!")
            App.notify("Error","You don't have enough armies to withdraw!")
            return false;
          }
        }).then(function(result){
          if (result != false) on("loadingContainer");
          return result;
        }).catch(function(err) {
        App.notify("An error occurred while removing armies from" +objectName+"", "Check MetaMask transaction and try again. Error: "+err+"");
        //console.log(err.message);
      });

    });
  },

  bomb: function() {

    var objectId = selected.properties.iso;
    var objectName = selected.properties.name;

    web3.eth.getAccounts(function(error, accounts) {

      if (error) {
      console.log(error);
      }

      var account = accounts[0];

      App.contracts.Crysk.deployed().then(function(instance) {
        cryskInstance = instance;
        return cryskInstance.getLockStatus(objectName);
      }).then(function(result) {
        if (result == false) return cryskInstance.itExists(objectName, {from: account});
        else {
          App.notify("Try again", "An action on this country is taking place");
          console.logBase("An action on this country is taking place, try again");
        }
      }).then(function(result) {
        if(result == true) return cryskInstance.getOwner(objectName, {from: account} );
        //Consider showing a div with the error
        else {
          App.notify("You can't drop a bomb in a virgin land", "You can still buy it!");
          console.logBase("You can't drop a bomb in a virgin land. You can still buy it!");
        }
      }).then(function(result) {
          $("#popUp2").fadeOut("done", function() {
            countryOnOff = false;  
          });
          if(result != account) return cryskInstance.getAvailableBombs(account, {from: account});
          else {
            App.notify("You own this country!", "avoid damaging yourself");
            console.logBase("You own this country! avoid damaging yourself");
          }
        }).then(function(result) {
          if(result.toNumber() >= 1)  return cryskInstance.dropABomb(objectName, {from: account});
          else {
          App.notify("You don't have enough bombs", "Go buy some!");
          console.logBase("You don't have enough bombs. Go buy some!");
          }
        }).then(function(result){
          on("loadingContainer");
          return result;
        }).catch(function(err) {
        App.notify("An error occurred while bombing " + objectName + "", "Check MetaMask transaction and try again. Error: "+err+"");
        //console.log(err.message);
      });

    });
  },

  Buy: function() {

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

      var account = accounts[0];

      App.contracts.Crysk.deployed().then(function(instance) {
        cryskInstance = instance;
        return cryskInstance.getLockStatus(objectName);
      }).then(function(result) {
        if (result == false) return cryskInstance.itExists(objectName, {from: account});
        else {
          App.notify("Try again", "An action on this country is taking place");
          console.logBase("An action on this country is taking place, try again");
        }
      }).then(function(result) {
        itexists = result;
        return cryskInstance.getPrice(objectName, {from: account});
      }).then(function(result) {
        var price = result.toNumber();
        price += price/10;
        $("#popUp2").fadeOut("done", function() {
          countryOnOff = false;
        });
        return cryskInstance.buyObject(objectName, {from: account, value: price});

      }).then(function(instance) {
        on("loadingContainer");
        return cryskInstance.getPlayerTeam(account, {from: account});
      }).catch(function(err) {
        App.notify("An error occurred while buying "+objectName+"", "Check MetaMask transaction and try again. Error: "+err+"");
        //console.log(err.message);
      });

    });  
  },

  setTeam: function() {
    
    var cryskInstance;
    var input = document.getElementById("inputGroupSelect");
    var team = input.options[input.selectedIndex].text;

    web3.eth.getAccounts(function(error, accounts) {

      if (error) {
      console.log(error);
      }

      var account = accounts[0];

      App.contracts.Crysk.deployed().then(function(instance) {
        cryskInstance = instance;
        return cryskInstance.changeTeam(team, {from: account});
      }).then(function() {
        on("loadingContainer");
        $("#popUp").fadeOut();
      }).catch(function(err) {
        App.notify("An error occurred while changing your team", "Check MetaMask transaction and try again. Error: "+err+"");
        //console.log(err.message);
      });

    });
    //location.reload();
  },

  BuyArmy: function() {
    var amount = document.getElementById('armiesnum').value;
    var playerlevel;
    var unitprice;
    var cryskInstance;

    web3.eth.getAccounts(function(error, accounts) {

      if (error) {
      console.log(error);
      }

      var account = accounts[0];

      App.contracts.Crysk.deployed().then(function(instance) {
        cryskInstance = instance;
        return cryskInstance.getPlayerLvl(account, {from: account});
      }).then(function(result) {
        playerlevel = result.toNumber();
        if(playerlevel == 0) playerlevel = 1;
        return playerlevel;
      }).then(function(instance) {
        return cryskInstance.getArmyUnitPrice({from: account});
      }).then(function(result) {
        unitprice = result.toNumber();
        return unitprice;
      }).then(function(instance) {
        var finalprice = unitprice*amount/playerlevel;
        finalprice += finalprice/10;
        $("#popUp").fadeOut("done", function() {playerOnOff = false;});
        return cryskInstance.buyArmy(amount, {from: account, value: finalprice});
      }).then(function() {
        on("loadingContainer");
      }).catch(function(err) {
        App.notify("An error occurred while buying armies", "Check MetaMask transaction and try again. Error: "+err+"");
        //console.log(err.message);
      });

    }); 
  },

  BuyBomb: function() {
    var amount = document.getElementById('bombsnum').value;
    var playerlevel;
    var unitprice;
    var cryskInstance;

    web3.eth.getAccounts(function(error, accounts) {

      if (error) {
      console.log(error);
      }

      var account = accounts[0];

      App.contracts.Crysk.deployed().then(function(instance) {
        cryskInstance = instance;
        return cryskInstance.getPlayerLvl(account, {from: account});
      }).then(function(result) {
        playerlevel = result.toNumber();
        if(playerlevel == 0) playerlevel = 1;
        return playerlevel;
      }).then(function(instance) {
        return cryskInstance.getBombUnitPrice({from: account});
      }).then(function(result) {
        unitprice = result.toNumber();
        return unitprice;
      }).then(function(instance) {
        var finalprice = unitprice*amount/playerlevel;
        finalprice += finalprice/10;
        $("#popUp").fadeOut("done", function() {playerOnOff = false;});
        return cryskInstance.buyBomb(amount, {from: account, value: finalprice});
      }).then(function() {
        on("loadingContainer");
      }).catch(function(err) {
        App.notify("An error occurred while buying bombs", "Check MetaMask transaction and try again. Error: "+err+"");
        //console.log(err.message);
      });

    });
  },

  refreshData: function() {
    x = 3;  //1 second

      //CHECK IF TRUE OR FALSE IS CORRECT
    App.setPlayer();
    
    setTimeout(App.setPlayer, x*1000);
  },

  pickPlayerColor(player) {

    var index;

      web3.eth.getAccounts(function(error, accounts) {

        if (error) {
        console.log(error);
        }

        App.contracts.Crysk.deployed().then(function(instance) {
          cryskInstance = instance;
          return cryskInstance.getPlayerTeam(player, {from: account});
        }).then(function(result) {
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
  },

  notify(notificationTitle, notificationText) {

    App.updatePlayerInfo(false);
    $('#info').append('<div class="modal fade text-white" id="infoModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true"><div class="modal-dialog modal-dialog-centered" role="document"><div class="modal-content"><div class="modal-header"><h5 class="modal-title text-dark" id="exampleModalLabel">' + notificationTitle + '</h5><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button></div><div class="modal-body bg-dark text-white">' + notificationText + '</div></div></div></div>');
    $('#infoModal').modal({
      backdrop: 'static',
      keyboard: false
    });
    setTimeout(function(){
      $("#infoModal").removeClass('fade').modal('hide');
      $("#info").empty();  
    }, 4000);
  },

  listenToEvents: function() {
    var newPlayerEvent;
    var buyEvent;
    var bombEvent;
    var nextLevelEvent;
    var attackInflictedEvent;
    var changedTeamEvent;
    var newOwnerEvent;
    var buyBombEvent;
    var buyArmyEvent;
    var armyAddedEvent;
    var upgradedEvent;
    var changedNickname;

    //players
    web3.eth.getAccounts(function(error, accounts) {

      if (error) {
      console.log(error);
      }

      var account = accounts[0];

      App.contracts.playersContract.deployed().then(function(instance) {
        playersInstance = instance;
        return playersInstance;
      }).then(function(result) {
          newPlayerEvent = playersInstance.playerCreated();
          changedNickame = playersInstance.changedNickname();
          nextLevelEvent = playersInstance.nextLevel();
          changedTeamEvent = playersInstance.changedTeam();
          buyBombEvent = playersInstance.buyBombs();
          buyArmyEvent = playersInstance.buyArmies();
          upgradedEvent = playersInstance.upgraded();
      }).then(function() {

        buyBombEvent.watch(function(error, result){
          if (!error) {
            if(account == result.args.adr) {
              var title = "Your bombs are here !";
              var text = "You succesfully bought your bombs and you're ready to use them";
              App.notify(title,text);
              App.updatePlayerInfo(false);
            }
          } else {
            
            console.log(error);
          }
        });

        buyArmyEvent.watch(function(error, result){
          if (!error) {
            if(account == result.args.adr) {
              var title = "Your armies are arrived !";
              var text = "You succesfully bought armies and you're ready to attack!";
              App.notify(title,text);
              App.updatePlayerInfo(false); 
            }
          } else {
            
            console.log(error);
          }
        });

        newPlayerEvent.watch(function(error, result){
          if (!error) {
            
            console.logBase( "New player just subscribed. Say hi to: " + result.args.adr);
          } else {
            
            console.log(error);
          }
        });

        nextLevelEvent.watch(function(error, result){
          if (!error) {

            App.updatePlayerInfo(false);            

            if (document.getElementById('logOpen').style.display == "block") blink('#logOpen');
            //SHOW NEXT LEVEL DIV CONGRATS !! CHOOSE an Upgrade between upgrading Army damage or bomb damage x2 on damage
            if(result.args.team == "BTC") console.logBTC("Player: " + result.args.adr + " level up !");
            else if(result.args.team == "BCH") console.logBCH("Player: " + result.args.adr + " level up !");
            else if(result.args.team == "XRP") console.logXRP("Player: " + result.args.adr + " level up !");
            else if(result.args.team == "ETH") console.logETH("Player: " + result.args.adr + " level up !");
            else console.logBase("Player: " + result.args.adr + " level up !");

          } else {
            
            console.log(error);
          }
        });

        changedTeamEvent.watch(function(error, result){
          if (!error) {

            //Repaint the map with the new team color
            
            App.updateMapColors();
            if(account == result.args.adr) {
              var title = "You changed team !";
              var text = "You succesfully changed team to: " + result.args.name;
              App.notify(title,text);
              App.updatePlayerInfo(false);
            }
            if (document.getElementById('logOpen').style.display == "block") blink('#logOpen');
            if(result.args.name == "BTC") console.logBTC("Player: " + result.args.adr + " changed its team to: " + result.args.name);
            else if(result.args.name == "BCH") console.logBCH("Player: " + result.args.adr + " changed its team to: " + result.args.name);
            else if(result.args.name == "XRP") console.logXRP("Player: " + result.args.adr + " changed its team to: " + result.args.name);
            else if(result.args.name == "ETH") console.logETH("Player: " + result.args.adr + " changed its team to: " + result.args.name);
            else console.logBase("Player: " + result.args.adr + " changed its team to: " + result.args.name);
          } else {
            console.log(error);
          }
        });

        changedNickame.watch(function(error, result) {
          if (!error) {

            //Repaint the map with the new team color
            
            App.updateMapColors();
            if(account == result.args.adr) {
              var title = "You changed nickname !";
              var text = "You succesfully changed nickname to: " + result.args.nick;
              App.notify(title,text);
              App.updatePlayerInfo(false);
            }
            if (document.getElementById('logOpen').style.display == "block") blink('#logOpen');
            if(result.args.name == "BTC") console.logBTC("Player: " + result.args.adr + " changed its nickname to: " + result.args.nick);
            else if(result.args.name == "BCH") console.logBCH("Player: " + result.args.adr + " changed its nickname to: " + result.args.nick);
            else if(result.args.name == "XRP") console.logXRP("Player: " + result.args.adr + " changed its nickname to: " + result.args.nick);
            else if(result.args.name == "ETH") console.logETH("Player: " + result.args.adr + " changed its nickname to: " + result.args.nick);
            else console.logBase("Player: " + result.args.adr + " changed its team to: " + result.args.name);
          } else {
            console.log(error);
          }
        });

        upgraded.watch(function(error, result) {
          if (!error) {

            //Repaint the map with the new team color
            var item;
            if(result.args.toggle == true) item = "bombs";
            if(result.args.toggle == false) item = "armies";
            
            App.updateMapColors();
            if(account == result.args.adr) {
              var title = "Upgrade complete !";
              var text = "You succesfully doubled the damage of your " + item + "";
              App.notify(title,text);
              App.updatePlayerInfo(false);
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

      var account = accounts[0];

      App.contracts.countriesContract.deployed().then(function(instance) {
        countriesInstance = instance;
        return countriesInstance;
      }).then(function(result) {
          attackInflictedEvent = countriesInstance.attackInflicted();
          newOwnerEvent = countriesInstance.newOwner();
          armyAddedEvent = countriesInstance.armyAdded();
      }).then(function() {

          newOwnerEvent.watch(function(error, result){
              if (!error) {
                
                App.updateMapColors();
                App.updateCountryInfo(result.args.country, false);

                //Notification if player is winner
                if(account == result.args.adr) {
                  var title = "You conquered a country !";
                  var text = "You succesfully invaded: " + result.args.country;
                  App.notify(title,text);
                  App.updatePlayerInfo(false);
                }

                //Notification if player's country has been conquered
                if(account == result.args.victim) {
                  var title = "Warning!";
                  var text =  result.args.adr + " just conquered: " + result.args.country;
                  App.notify(title,text);
                }


                if (document.getElementById('logOpen').style.display == "block") blink('#logOpen');
                if(result.args.team == "BTC") console.logBTC("Player: " + result.args.adr + " of " + result.args.team + " team conquered " + result.args.country);
                else if(result.args.team == "BCH") console.logBCH("Player: " + result.args.adr + " of " + result.args.team + " team conquered " + result.args.country);
                else if(result.args.team == "XRP") console.logXRP("Player: " + result.args.adr + " of " + result.args.team + " team conquered " + result.args.country);
                else if(result.args.team == "ETH") console.logETH("Player: " + result.args.adr + " of " + result.args.team + " team conquered " + result.args.country);
                else console.logBase("Player: " + result.args.adr + " of " + result.args.team + " team conquered " + result.args.country);

              } else { 
                console.log(error);
              }
          });

          armyAddedEvent.watch(function(error, result){
              if (!error) {

                if (result.args.direction == true) {
                  //Notification if player the msg.sender
                  if(account == result.args.adr) {
                    var title = "You're defenses are growing up !";
                    var text = "You succesfully added " + result.args.amount + " armies in defense of " + result.args.name;
                    App.notify(title,text);
                    App.updatePlayerInfo(false);
                  } else {
                    console.logBase("Player: " + result.args.adr + " added " + result.args.amount +" soldiers defending " + result.args.name);
                  }
                } else {
                  //Notification if player the msg.sender
                  if(account == result.args.adr) {
                    var title = "You've recollected armies!";
                    var text = "You succesfully removed " + result.args.amount + " armies from " + result.args.name;
                    App.notify(title,text);
                    App.updatePlayerInfo(false);
                  } else {
                    console.logBase("Player: " + result.args.adr + " removed " + result.args.amount +" soldiers from " + result.args.name);
                  }
                }

                App.updateCountryInfo(result.args.name, false);
                App.updatePlayerInfo(false);
                
              } else {
                
                console.log(error);
              }
          });

          attackInflictedEvent.watch(function(error, result){
              if (!error) {

                //Notification if player is attacker
                if(account == result.args.adr) {
                  var title = "You attacked a country !";
                  var text = "You succesfully produced a damage of: " + result.args.damagenum + " to " + result.args.country;
                  App.notify(title,text);
                  App.updatePlayerInfo(false);
                }

                //Notification if player is victim
                if(account == result.args.victim && result.args.damagenum != 0) {
                  var title = "Warning!";
                  var text =  result.args.adr + " just inflicted you a damage of: " + result.args.damagenum + " in " + result.args.country;
                  App.notify(title,text);
                }

                
                if (result.args.damagenum == 0) {
                  if(result.args.team == "BTC") console.logBTC(" No damage inflicted from player: " + result.args.adr + " to " + result.args.name);
                  else if(result.args.team == "BCH") console.logBCH(" No damage inflicted from player: " + result.args.adr + " to " + result.args.name);
                  else if(result.args.team == "XRP") console.logXRP(" No damage inflicted from player: " + result.args.adr + " to " + result.args.name);
                  else if(result.args.team == "ETH") console.logETH(" No damage inflicted from player: " + result.args.adr + " to " + result.args.name);
                  else console.logBase(" No damage inflicted from player: " + result.args.adr + " to " + result.args.name);
                  App.updatePlayerInfo(false);
                }
                
                //CLOSE LOADING CLOSe
                //SHOW DIV DAMAGE
                //CONSIDER DOING THIS ON THE .then functions of the corresponding action function (attack or dropbomb)
                App.updatePlayerInfo(false);
                App.updateCountryInfo(result.args.name, false);

                if (document.getElementById('logOpen').style.display == "block") blink('#logOpen');
                if(result.args.team == "BTC") console.logBTC("Damage of " + result.args.num + " inflicted from player: " + result.args.adr + " to " + result.args.name);
                else if(result.args.team == "BCH") console.logBCH("Damage of " + result.args.num + " inflicted from player: " + result.args.adr + " to " + result.args.name);
                else if(result.args.team == "XRP") console.logXRP("Damage of " + result.args.num + " inflicted from player: " + result.args.adr + " to " + result.args.name);
                else if(result.args.team == "ETH") console.logETH("Damage of " + result.args.num + " inflicted from player: " + result.args.adr + " to " + result.args.name);
                else console.logBase("Damage of " + result.args.num + " inflicted from player: " + result.args.adr + " to " + result.args.name);

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

      var account = accounts[0];

      App.contracts.attacksContract.deployed().then(function(instance) {
          attacksInstance = instance;
          return attacksInstance;
      }).then(function(result) {
            attackInflictedEvent = attacksInstance.attackInflicted();
            bombEvent = attacksInstance.dropBomb();
      }).then(function() {

            attackInflictedEvent.watch(function(error, result){
                if (!error) {

                  //Notification if player is attacker
                  if(account == result.args.adr) {
                    var title = "You attacked a country !";
                    var text = "You succesfully produced a damage of: " + result.args.damagenum + " to " + result.args.country;
                    App.notify(title,text);
                    App.updatePlayerInfo(false);
                  }

                  //Notification if player is victim
                  if(account == result.args.victim && result.args.damagenum != 0) {
                    var title = "Warning!";
                    var text =  result.args.adr + " just inflicted you a damage of: " + result.args.damagenum + " in " + result.args.country;
                    App.notify(title,text);
                  }

                  
                  if (result.args.damagenum == 0) {
                    if(result.args.team == "BTC") console.logBTC(" No damage inflicted from player: " + result.args.adr + " to " + result.args.name);
                    else if(result.args.team == "BCH") console.logBCH(" No damage inflicted from player: " + result.args.adr + " to " + result.args.name);
                    else if(result.args.team == "XRP") console.logXRP(" No damage inflicted from player: " + result.args.adr + " to " + result.args.name);
                    else if(result.args.team == "ETH") console.logETH(" No damage inflicted from player: " + result.args.adr + " to " + result.args.name);
                    else console.logBase(" No damage inflicted from player: " + result.args.adr + " to " + result.args.name);
                    App.updatePlayerInfo(false);
                  }
                  
                  //CLOSE LOADING CLOSe
                  //SHOW DIV DAMAGE
                  //CONSIDER DOING THIS ON THE .then functions of the corresponding action function (attack or dropbomb)
                  App.updatePlayerInfo(false);
                  App.updateCountryInfo(result.args.name, false);

                  if (document.getElementById('logOpen').style.display == "block") blink('#logOpen');
                  if(result.args.team == "BTC") console.logBTC("Damage of " + result.args.num + " inflicted from player: " + result.args.adr + " to " + result.args.name);
                  else if(result.args.team == "BCH") console.logBCH("Damage of " + result.args.num + " inflicted from player: " + result.args.adr + " to " + result.args.name);
                  else if(result.args.team == "XRP") console.logXRP("Damage of " + result.args.num + " inflicted from player: " + result.args.adr + " to " + result.args.name);
                  else if(result.args.team == "ETH") console.logETH("Damage of " + result.args.num + " inflicted from player: " + result.args.adr + " to " + result.args.name);
                  else console.logBase("Damage of " + result.args.num + " inflicted from player: " + result.args.adr + " to " + result.args.name);

                } else {
                  //$("#loader").hide();
                  console.log(error);
                }
            });

            bombEvent.watch(function(error, result){
              if (!error) {

                //Notification if player is attacker
                if(account == result.args.adr) {
                  var title = "You attacked a country !";
                  var text = "You succesfully dropped a bomb on: " + result.args.name;
                  App.notify(title,text);
                  App.updatePlayerInfo(false);
                }

                //Notification if player is victim
                //Noone since it will show up like an attack inflicted

                App.updateCountryInfo(result.args.name, false);
                App.updatePlayerInfo(false);

                if (document.getElementById('logOpen').style.display == "block") blink('#logOpen');
                if(result.args.team == "BTC") console.logBTC("Player: " + result.args.adr + " dropped a bomb on " + result.args.name);
                else if(result.args.team == "BCH") console.logBCH("Player: " + result.args.adr + " dropped a bomb on " + result.args.name);
                else if(result.args.team == "XRP") console.logXRP("Player: " + result.args.adr + " dropped a bomb on " + result.args.name);
                else if(result.args.team == "ETH") console.logETH("Player: " + result.args.adr + " dropped a bomb on " + result.args.name);
                else console.logBase("Player: " + result.args.adr + " dropped a bomb on " + result.args.name);

              } else {
                
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

      var account = accounts[0];

      App.contracts.marketplaceContract.deployed().then(function(instance) {
          marketplaceInstance = instance;
          return marketplaceInstance;
      }).then(function(result) {
          buyEvent = marketplaceInstance.buyEvent();
      }).then(function() {

          buyEvent.watch(function(error, result){
            if (!error) {
              //Update owned countries count
              App.updatePlayerInfo();
              //Update Owner, Price and Army
              App.updateCountryInfo(result.args.name, false);

              //Notification if player is the buyer
              if(account == result.args.adr) {
                var title = "You bought a country !";
                var text = "You succesfully bought: " + result.args.name;
                App.notify(title,text);
              }

              //Notification if player's country has been bought
              if(account == result.args.victim) {
                var title = "Warning!";
                var text =  result.args.adr + " just bought from you: " + result.args.name;
                App.notify(title,text);
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
              if(result.args.team == "BTC") console.logBTC("Player: " + result.args.adr + " bought: " + result.args.name);
              else if(result.args.team == "BCH") console.logBCH("Player: " + result.args.adr + " bought: " + result.args.name);
              else if(result.args.team == "XRP") console.logXRP("Player: " + result.args.adr + " bought: " + result.args.name);
              else if(result.args.team == "ETH") console.logETH("Player: " + result.args.adr + " bought: " + result.args.name);
              else console.logBase("Player: " + result.args.adr + " bought: " + result.args.name);
            } else {
              console.log(error);
            }
          });           
        }).catch(function(err) {
          console.log(err.message);
        });
    });


  }
};

//ZOOM AND PAN FUNCTIONALITIES
{
  function Zoom(args) {
        $.extend(this, {
          $buttons:   $(".zoom-button"),
          $info:      $("#zoom-info"),
          scale:      { max: 80, currentShift: 0 },
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

        this._displayPercentage(1);
        this.listen();
  };
  Zoom.prototype.listen = function() {
        this.$buttons.off("click").on("click", this._handleClick.bind(this));

        this.datamap.svg
          .call(this.d3Zoom.on("zoom", this._handleScroll.bind(this)))
          .on("dblclick.zoom", null); // disable zoom on double-click
  };
  Zoom.prototype.reset = function() {
      
      this._shift("reset");
  };
  Zoom.prototype._handleScroll = function() {
        var translate = d3.event.translate,
            scale = d3.event.scale,
            limited = this._bound(translate, scale);

        this.scrolled = true;

        this._update(limited.translate, limited.scale);
  };
  Zoom.prototype._handleClick = function(event) {

        if (event.target.id == "zoomButton0" ) direction = "reset";
        if (event.target.id == "zoomButtonMinus") direction = "out";
        if (event.target.id == "zoomButtonPlus") direction = "in";

        this._shift(direction);
  };
  Zoom.prototype._shift = function(direction) {
        var center = [ this.$container.width() / 2, this.$container.innerHeight() / 2 ],
            translate = this.d3Zoom.translate(), translate0 = [], l = [],
            view = {
              x: translate[0],
              y: translate[1],
              k: this.d3Zoom.scale()
            }, bounded;

        translate0 = [
          (center[0] - view.x) / view.k,
          (center[1] - view.y) / view.k
        ];

        if (direction == "reset") {
          view.k = 1;
          this.scrolled = true;
        } else {
          view.k = this._getNextScale(direction);
        }
  l = [ translate0[0] * view.k + view.x, translate0[1] * view.k + view.y ];

        view.x += center[0] - l[0];
        view.y += center[1] - l[1];

        bounded = this._bound([ view.x, view.y ], view.k);

        this._animate(bounded.translate, bounded.scale);
  };
  Zoom.prototype._bound = function(translate, scale) {
        var width = this.$container.width(),
            height = this.$container.innerHeight();

        translate[0] = Math.min(
          (width / height)  * (scale - 1),
          Math.max( width * (1 - scale), translate[0] )
        );

        translate[1] = Math.min(0, Math.max(height * (1 - scale), translate[1]));

        return { translate: translate, scale: scale };
  };
  Zoom.prototype._update = function(translate, scale) {
        this.d3Zoom
          .translate(translate)
          .scale(scale);

        this.datamap.svg.selectAll("g")
          .attr("transform", "translate(" + translate + ")scale(" + scale + ")");

        this._displayPercentage(scale);
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
  Zoom.prototype._displayPercentage = function(scale) {
    var value;
    value = Math.round(Math.log(scale) / Math.log(this.scale.max) * 100);
    this.$info.text(value + "%");
  };
  Zoom.prototype._getScalesArray = function() {
        var array = [],
            scaleMaxLog = Math.log(this.scale.max);

        for (var i = 0; i <= 10; i++) {
          array.push(Math.pow(Math.E, 0.1 * i * scaleMaxLog));
        }

        return array;
  };
  Zoom.prototype._getNextScale = function(direction) {
        var scaleSet = this.scale.set,
            currentScale = this.d3Zoom.scale(),
            lastShift = scaleSet.length - 1,
            shift, temp = [];

        if (this.scrolled) {

          for (shift = 0; shift <= lastShift; shift++) {
            temp.push(Math.abs(scaleSet[shift] - currentScale));
          }

          shift = temp.indexOf(Math.min.apply(null, temp));

          if (currentScale >= scaleSet[shift] && shift < lastShift) {
            shift++;
          }

          if (direction == "out" && shift > 0) {
            shift--;
          }

          this.scrolled = false;

        } else {

          shift = this.scale.currentShift;

          if (direction == "out") {
            shift > 0 && shift--;
          } else {
            shift < lastShift && shift++;
          }
        }

        this.scale.currentShift = shift;

        return scaleSet[shift];
  };
  var fills = {
      defaultFill: defaultColor, // Any hex, color name or rgb/rgba value Index 0
      BTCFill: btcColor,//red yellow index 1
      BCHFill: bchColor,//green index 2
      XRPFill: xrpColor,//yellow index 3
      ETHFill: ethColor// blue index 4
  };
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
          off("defending");
          off("defendingInput");
          off("Attack");
          off("attackingInput");
          off("bombing");
          off("Buy");
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
      else return;   
    }
  };
});

//ON LOAD WINDOW !!!!!!!!!!!!!!!
$(window).load(function() {

  //Press globalView button
  selectedView = 'globalview';
  var initView = $('#'+selectedView+'').closest('.btn');
  initView.removeClass('btn-dark');
  initView.removeClass('text-white');
  initView.addClass('btn-light');
  initView.addClass('text-dark');


  //DO THE MAP
  function Datamap() {
        var tmp = this;
        this.$container = $("#div");
        this.instance = new Datamaps({
          scope: 'world',
          responsive: true,
          element: this.$container.get(0),
          projection: 'mercator',
          aspectRatio: 0.625,
          done: function(datamap) {
            MapData = datamap;
            tmp.zoom = new Zoom({
              $container: tmp.$container,
              datamap: datamap
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
  };
  //$('#div').append('<div id="title"><h1 class="text-center" id="Title"><font id="titleColor" color="white">Crysk</font></h1></h1></div>');
  //$('#div').append('<div class="col zoomBar"><button class="zoom-button bg-dark" data-zoom="reset"><p class="thick"><font id="zoomButton0" color="white">0</font></p></button></button><button class="zoom-button bg-dark" data-zoom="out"><p class="thick"><font id="zoomButtonMinus" color="white">-</font></p></button><button class="zoom-button bg-dark" data-zoom="in"><p class="thick"><font id="zoomButtonPlus" color="white">+</font></p></button><div class="text-white zoom-info" id="zoom-info"></div></div>');

  map = new Datamap();
  map.instance.svg.selectAll('.datamaps-subunit').on('click', function(geography) {
    App.showDiv(geography.properties.name); 
    selected = geography;
    state_id = geography.id;
    fillkeys = Object.keys(fills);
    $("#popUp2").fadeIn("done", function() {countryOnOff = true;});
  });
    
  //Init App
  App.init();

  //Initialize map colors
  setTimeout(function(){
    var i = 0;
    fillkeys = Object.keys(fills);
    for(const item of states) {
      App.pickColor(item,i,true);
      i++;  
    }
  }, 1000);

  //Initial modal
  if(sessionStorage.getItem('myModal') !== 'yes') {
    $('#myModal').modal({
      backdrop: 'static',
      keyboard: false
    });
    sessionStorage.setItem('myModal', 'yes');
  }

  setTimeout(function() {
    App.updatePlayerInfo(false);
    App.listenToEvents();
  }, 3000); 


  //On select initial team listen for events
  $('#inputGroupSelect2').on('click', function() {
    
    App.listenToEvents();
  });

  //Change team from iniial modal (it will close the modal)
  $('#setInitialTeam').on('click', function() {
    App.listenToEvents();
    App.updatePlayerInfo(false);
    var cryskInstance;
    var input = document.getElementById("inputGroupSelect2");
    var team = input.options[input.selectedIndex].text;

    web3.eth.getAccounts(function(error, accounts) {

      if (error) {
      console.log(error);
      }

      var account = accounts[0];

      App.contracts.Crysk.deployed().then(function(instance) {
        cryskInstance = instance;
        $('#myModal').modal('hide');
        on("loadingContainer");
        return cryskInstance.changeTeam(team, {from: account});
      }).then(function(result) {
        on("loadingContainer"); 
        return result;
      }).catch(function(err) {
        console.log(err.message);
      });
        
    });
  });

  //On close modal (click on Play)
  $('#dialogPlay').on('click', function() {
    App.listenToEvents();
    App.updatePlayerInfo(false);
    $('#myModal').modal('hide');
    on("loadingContainer");

    /*web3.eth.getAccounts(function(error, accounts) {

      if (error) {
      console.log(error);
      }

      var account = accounts[0];

      App.contracts.Crysk.deployed().then(function(instance) {
        cryskInstance = instance;
        $('#myModal').modal('hide');
        on("loadingContainer");
        return cryskInstance.getPlayerTeam(account, {from: account});
      }).then(function(result) {

      }).catch(function(err) {
        console.log(err.message);
      });

      App.refreshData();        
    });*/

  });

  //Open/Close Player menu
  $("#menuToggle").on('click', function() {
    if (document.getElementById("popUp").style.display == "block") {
      return} else {
      $("#popUp").fadeIn("done", function() {playerOnOff = true;});
      document.getElementById("popUp").style.display = "block";
    }
  });

  //On click to logToggle
  $('#logOpen').on('click', function() {
    off('logOpen');
    on('list');
    logOnOff = true;
  });

  //On change nickname
  $('#changeNickButton').on('click', function() {
    var nick = document.getElementById('newNickName').value;
    App.setNickName(nick);
    $('#changeNickModal').modal('hide');
  });

  App.refreshData();

});

//Override console, need to specify the node with the configured background and the message as arguments
window.console = {
  logBase: function(str){
    var node = document.createElement("p");
    node.setAttribute("id", "logLine");
    node.setAttribute("style", "background-color: rgba(80,80,80,0.4);");
    node.setAttribute("class", "text-dark thick");
    node.appendChild(document.createTextNode(str));
    document.getElementById("list").insertBefore(node, document.getElementById("list").firstChild );
    //document.getElementById("list").appendChild(node);
  },

  logETH: function(str){
    var node = document.createElement("p");
    node.setAttribute("id", "logLine");
    node.setAttribute("style", "background-color: rgba(26, 117, 255,0.6);");
    node.setAttribute("class", "text-dark thick");
    node.appendChild(document.createTextNode(str));
    document.getElementById("list").insertBefore(node, document.getElementById("list").firstChild );
    //document.getElementById("list").appendChild(node);
  },

  logBCH: function(str){
    var node = document.createElement("p");
    node.setAttribute("id", "logLine");
    node.setAttribute("style", "background-color: rgba(77, 255, 77,0.6);");
    node.setAttribute("class", "text-dark thick");
    node.appendChild(document.createTextNode(str));
    document.getElementById("list").insertBefore(node, document.getElementById("list").firstChild );
    //document.getElementById("list").appendChild(node);
  },

  logBTC: function(str){
    var node = document.createElement("p");
    node.setAttribute("id", "logLine");
    node.setAttribute("style", "background-color: rgba(255, 51, 51,0.6);");
    node.setAttribute("class", "text-dark thick");
    node.appendChild(document.createTextNode(str));
    document.getElementById("list").insertBefore(node, document.getElementById("list").firstChild );
    //document.getElementById("list").appendChild(node);
  },

  logXRP: function(str){
    var node = document.createElement("p");
    node.setAttribute("id", "logLine");
    node.setAttribute("style", "background-color: rgba(255, 255, 26,0.6);");
    node.setAttribute("class", "text-dark thick");
    node.appendChild(document.createTextNode(str));
    document.getElementById("list").insertBefore(node, document.getElementById("list").firstChild );
    //document.getElementById("list").appendChild(node);
  },
}

//Be responsive and redraw map
window.addEventListener('resize', function(event) {
  
  //RE-DO THE MAP
  function Datamap() {
        var tmp = this;
        this.$container = $("#div");
        this.instance = new Datamaps({
          scope: 'world',
          responsive: true,
          element: this.$container.get(0),
          projection: 'mercator',
          aspectRatio: 0.625,
          done: function(datamap) {
            MapData = datamap;
            tmp.zoom = new Zoom({
              $container: tmp.$container,
              datamap: datamap
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
  };
  $('#div').empty();
  //$('#div').append('<div id="title"><h1 class="text-center" id="Title"><font id="titleColor">Crysk</font></h1></div>');
  //$('#div').append('<div class="col zoomBar"><button class="zoom-button bg-dark" data-zoom="reset"><p class="thick"><font id="zoomButton0" color="white">0</font></p></button></button><button class="zoom-button bg-dark" data-zoom="out"><p class="thick"><font id="zoomButtonMinus" color="white">-</font></p></button><button class="zoom-button bg-dark" data-zoom="in"><p class="thick"><font id="zoomButtonPlus" color="white">+</font></p></button><div class="text-white zoom-info" id="zoom-info"></div></div>');
  map = new Datamap();
    map.instance.svg.selectAll('.datamaps-subunit').on('click', function(geography) {
      App.showDiv(geography.properties.name); 
      selected = geography;
      state_id = geography.id;
      fillkeys = Object.keys(fills);
      $("#popUp2").fadeIn("done", function() {countryOnOff = true;});
    });

  App.updatePlayerInfo();
  App.updateMapColors();
});

//Utilities
function on(name) {
  
  document.getElementById(name).style.display = "block";
}

function off(name) {
  
  document.getElementById(name).style.display = "none";
}

function blink(selector){
  $(selector).fadeOut('slow');
  $(selector).fadeIn('slow');
}

function showNickNameDialog(){
  $('#changeNickModal').modal({
    backdrop: 'static',
    keyboard: false
  });
}

//To activate on mobile
screen.orientation.lock('landscape');
