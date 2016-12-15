import React, { Component } from 'react';
import { SensorManager } from 'NativeModules';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  Image,
  Dimensions,
  DeviceEventEmitter,
  Animated,
} from 'react-native';
import PetBox from './petBox.js';
import Buttons from './buttons.js';
import StatusMessage from './statusMessage.js';
import Info from './info.js';
import Restart from './restart.js';
import Question from './question.js';

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
  },
  questionContainer: {
    flex: 10.5,
  },
  questionOverlay: {
    flex: 1,
  },
  gifContainer: {
    flex: 4,
  },
  statusContainer: {
    flex: 1,
  },
  statusMsg: {
    fontWeight: 'bold',
    fontSize: 20,
    marginTop: 20,
    textAlign: 'center',
  },
  statusText: {
    color: 'red',
  },
  statsContainer: {
    flex: 3.5,
  },
  logContainer: {
    flex: 2,
    paddingLeft: 20
  },
  actionContainer: {
    flex: 1.2,
    paddingTop: 10,
  },
  petGif: {
    width: Dimensions.get('window').width,
    top: 0,
    height: 226
  }
});

var mSensorManager = require('NativeModules').SensorManager;

export default class NativeHR extends Component {
  constructor(props) {
    super(props);
    this.getLog = this.getLog.bind(this);
    this.state = {
      name: null,
      mood: null,
      level: 0,
      phys: null,
      img: null,
      status: null,
      health: 0,
      experience: 0,
      feed: 0,
      love: 0,
      showNewName: false,
      isDark: false,
      isDarkCounter: 0,
      isQuestion: false,
      question: null,
      answer: null,
      choices: [],
      correctAnswer: false,
      cmdImg: {
        food: 'food1',
        sleep: 'sleep1',
        love: 'love1',
        code: 'code1'
      },
      logs: [],
      light: new Animated.Value(0)
    };

    var that = this;
    setInterval(function() {
      if (that.state.status !== 'dead') {
        that.getCurrent();
        that.getLog();
      }
    }, 2000);

    window.sensorHandler = (status, link, obj) => {
      console.log('status', this.state.status);
      if (status) {
        fetch(link, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(obj)
        })
        .then((response) => response)
        .then((data) => {
          that.getCurrent();
        })
        .catch((error) => {
          console.warn(error);
        }).done();
      }
    };
  }

  componentDidMount() {
    var that = this;
    DeviceEventEmitter.addListener('LightSensor', function (data) {
      Animated.spring(
        that.state.light, 
        {
          toValue: data.light
        }
      ).start();
      if (data.light <= 5) {
        var sleeping = {'status': 'sleeping'};
        var awake = (that.state.status !== 'sleeping' && that.state.status !== 'dead');
        window.sensorHandler(awake, 'http://138.68.6.148:3000/api/pet', sleeping);
      }
    });
    DeviceEventEmitter.addListener('Accelerometer', function (data) {
      if (data.x > 30) {
        var name = {'name': that.state.name};
        var dead = (that.state.status === 'dead');
        window.sensorHandler(dead, 'http://138.68.6.148:3000/api/newPet', name);
      }
    });
    // mSensorManager.startAccelerometer(100);
    // mSensorManager.startLightSensor(100);
  }

  componentWillMount() {
    this.getCurrent();
    this.getLog();
  }

  getCurrent() {
    var that = this;

    fetch('http://138.68.6.148:3000/api/pet', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    })
    .then((response) => response.json())
    .then((data) => {
      console.log('pet data', data);
      that.setState({
        name: data.name,
        mood: data.mood,
        level: data.level,
        phys: data.phys,
        img: data.img,
        health: data.health,
        experience: data.experience,
        feed: data.feed,
        status: data.status,
        love: data.love,
        showNewName: false,
        newPetName: ''
      });
    })
    .catch((error) => {
      console.warn(error);
    }).done();
  }

  getLog() {
    console.log('Fetching log messages...');
    var that = this;

    fetch('http://138.68.6.148:3000/log', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    })
    .then((response) => response.json())
    .then((data) => {
      console.log('log data', data);
      that.setState({
        logs: data
      });
    })
    .catch((error) => {
      console.warn(error);
    }).done();
  }

  getInput(text) {
    var key = 'newPetName';
    var value = text;
    var obj = {};
    obj[key] = value;
    this.setState(obj);
  }

  getQuestion() {
    var that = this;
    fetch('https://www.opentdb.com/api.php?amount=1&type=multiple', {
      method: 'GET',
    })
    .then((response) => response.json())
    .then((data) => {
      that.setState({
        isQuestion: !this.state.isQuestion,
        question: data.results[0].question,
        answer: data.results[0].correct_answer,
        choices: that.randomizer(data.results[0].incorrect_answers, data.results[0].correct_answer),
      });
    })
    .catch((error) => {
      console.warn(error);
    }).done();
  }

  setStatus(status) {
    var that = this;
    console.log(status);

    fetch('http://138.68.6.148:3000/api/pet', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({status: status})
    })
    .then((response) => response.json())
    .then((data) => {
      console.log('clicked');
      that.getCurrent();
    })
    .catch((error) => {
      console.warn(error);
    }).done();
  }

  showNameInput() {
    this.setState({
      showNewName: !this.showNewName
    });
  }

  newPet(e) {
    var that = this;
    fetch('http://138.68.6.148:3000/api/newPet', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({name: that.state.newPetName})
    })
    .then((response) => response)
    .then((data) => {
      console.log('clicked');
      that.getCurrent();
    })
    .catch((error) => {
      console.warn(error);
    }).done();
  }

  changeCommandIcon (command) {
    if (command === 'eating') {
      this.setState({cmdImg: {
        food: 'food2',
        sleep: 'sleep1',
        love: 'love1',
        code: 'code1'
      }});
    } else if (command === 'sleeping') {
      this.setState({cmdImg: {
        food: 'food1',
        sleep: 'sleep2',
        love: 'love1',
        code: 'code1'
      }});
    } else if (command === 'coding') {
      this.setState({cmdImg: {
        food: 'food1',
        sleep: 'sleep1',
        love: 'love1',
        code: 'code2'
      }});
    } else if (command === 'playing') {
      this.setState({cmdImg: {
        food: 'food1',
        sleep: 'sleep1',
        love: 'love2',
        code: 'code1'
      }});
    }
  }

  checkAnswer(choice) {
    if (choice === this.state.answer) {
      this.setState({
        isQuestion: !this.state.isQuestion
      });
      var sleeping = {'status': 'coding'};
      window.sensorHandler(true, 'http://138.68.6.148:3000/api/pet', sleeping);
    }   
  }

  executeCommand(command) {
    this.changeCommandIcon(command);
    this.setStatus(command);
    this.getCurrent();
  }

  randomizer(arr, answer) {
    arr.push(answer);
    for (var i = 0; i < arr.length; i++) {
      var temp = Math.floor(Math.random() * arr.length);
      var swap = arr[temp];
      arr[temp] = arr[i];
      arr[i] = swap;
    }
    return arr;
  }

  render() {
    var color = this.state.light.interpolate({
      inputRange: [0, 40],
      outputRange: ['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']
    });

    return (
      <Animated.View style={[styles.appContainer, {backgroundColor: 'white'}]}>
        <View style={styles.questionContainer}>{ !this.state.isQuestion ? (
          <View className='questionOverlay' style={styles.questionOverlay}>
            <View style={styles.gifContainer}>
              <Image source={{uri: this.state.img}} style={styles.petGif}>
                <View style={styles.infoContainer}>
                  <Info info={this.state}/>
                </View>
              </Image>
            </View>
            <View style={styles.statusContainer}>
              <Text style={styles.statusMsg}>{this.state.name} is currently <Text style={styles.statusText}>{this.state.status}</Text>!</Text>
            </View>
            <View style={styles.statsContainer}>
              <PetBox pet={this.state}/>
            </View>
            <View style={styles.logContainer}>
              <StatusMessage logs={this.state.logs}/>
            </View>
          </View>) : <Question question={this.state.question} answer={this.state.answer} checkAnswer={this.checkAnswer.bind(this)} choices={this.state.choices}/>}
          </View>
        <View style={styles.actionContainer}>{
          this.state.status !== 'dead' ? (<View style={{flex: 1}}>
            <Buttons cmdImg={this.state.cmdImg} executeCommand={this.executeCommand.bind(this)} getQuestion={this.getQuestion .bind(this)}/>
          </View>) : <Restart showNameInput={this.showNameInput.bind(this)} showNewName={this.state.showNewName} getInput={this.getInput.bind(this)} newPet={this.newPet.bind(this)}></Restart>
        }</View>
      </Animated.View>
    );
  }
}

AppRegistry.registerComponent('NativeHR', () => NativeHR);
