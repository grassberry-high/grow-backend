'use strict';
const mongoose = require('mongoose');

const ObjectId = mongoose.Types.ObjectId;

const chamberDummies = () =>
  ({
    upsertMainBox: {
      '_id': '588a427d617fff11d79b3047',
      'name': 'Main Box',
      'cycle': 'mother',
      'strains': [
        {
          'name': null,
          'daysToHarvest': null,
        },
      ],
      'rules': [
        {
          '_id': '588a427d617fff11d79b3054',
          'device': 'an',
          'sensor': {
            '_id': '588a427d617fff11d79b304a',
            'address': 64,
            'model': 'hdc1000',
            'detectors': [
              {
                'type': 'temperature',
                'label': 'Temperature (Right)',
                'name': 'Temperature (Right)',
                'unit': 'C',
                '_id': '5936580049e76d2bf05223e2',
              },
              {
                'type': 'humidity',
                'label': 'Humidity (Right)',
                'name': 'Humidity (Right)',
                'unit': 'RF',
                '_id': '5936580049e76d2bf05223e1',
              },
            ],
            '__v': 0,
          },
          'relay': {
            '_id': '588a427d617fff11d79b304f',
            'label': 'Relay II',
            'name': 'Ventilation (right)',
            'address': 2,
            '__v': 0,
          },
          'forDetector': 'temperature',
          'detectorId': '5954ba2ac72d410b3711837f',
          'onValue': 30,
          'offValue': 20,
          'unit': 'C',
          '__v': 0,
        },
        {
          '_id': '588a427d617fff11d79b3056',
          'device': 'fan',
          'sensor': {
            '_id': '588a427d617fff11d79b304a',
            'address': 64,
            'model': 'hdc1000',
            'detectors': [
              {
                'type': 'temperature',
                'label': 'Temperature (Right)',
                'name': 'Temperature (Right)',
                'unit': 'C',
                '_id': '5936580049e76d2bf05223e2',
              },
              {
                'type': 'humidity',
                'label': 'Humidity (Right)',
                'name': 'Humidity (Right)',
                'unit': 'RF',
                '_id': '5936580049e76d2bf05223e1',
              },
            ],
            '__v': 0,
          },
          'relay': {
            '_id': '588a427d617fff11d79b304f',
            'label': 'Relay II',
            'name': 'Ventilation (right)',
            'address': 2,
            '__v': 0,
          },
          'forDetector': 'humidity',
          'detectorId': '5954ba2ac72d410b3711837e',
          'onValue': 70,
          'offValue': 60,
          'unit': 'RFH',
          '__v': 0,
        },
        {
          '_id': '588a427d617fff11d79b3058',
          'sensor': {
            '_id': '588a427d617fff11d79b304b',
            'address': 33,
            'model': 'chirp',
            'detectors': [
              {
                'type': 'water',
                'label': 'Watersensor I',
                'name': 'Watersensor I',
                '_id': '5936580049e76d2bf05223e3',
              },
            ],
            '__v': 0,
          },
          'relay': {
            '_id': '588a427d617fff11d79b3050',
            'label': 'Relay III',
            'name': 'Watering (right)',
            'address': 3,
            '__v': 0,
          },
          'device': 'pump',
          'detectorId': '5954ba2ac72d410b37118381',
          'forDetector': 'water',
          'durationMSOn': 1000,
          '__v': 0,
        },
      ],
      'light': {
        'relay': {
          '_id': '588a427d617fff11d79b304e',
          'label': 'Relay I',
          'name': 'LED (right)',
          'address': 1,
          '__v': 0,
        },
        'durationHOn': 18,
        'startTime': '2016-11-28T07:30:00.749Z',
      },
      'displays': [
        {
          '_id': '588a427d617fff11d79b304d',
          'address': 77,
          'model': 'mhz16',
          'detectors': [
            {
              'type': 'co2',
              'label': 'CO2 Sensor',
              'name': 'CO2 Sensor',
              '_id': '5936580049e76d2bf05223e5',
            },
          ],
          '__v': 0,
        },
      ],
      '__v': 0,
      'activeSensors': [
        {
          '_id': '588a427d617fff11d79b304a',
          'address': 64,
          'model': 'hdc1000',
          'detectors': [
            {
              'type': 'temperature',
              'label': 'Temperature (Right)',
              'name': 'Temperature (Right)',
              'unit': 'C',
              '_id': '5936580049e76d2bf05223e2',
            },
            {
              'type': 'humidity',
              'label': 'Humidity (Right)',
              'name': 'Humidity (Right)',
              'unit': 'RF',
              '_id': '5936580049e76d2bf05223e1',
            },
          ],
          '__v': 0,
        },
        {
          '_id': '588a427d617fff11d79b304d',
          'address': 77,
          'model': 'mhz16',
          'detectors': [
            {
              'type': 'co2',
              'label': 'CO2 Sensor',
              'name': 'CO2 Sensor',
              '_id': '5936580049e76d2bf05223e5',
            },
          ],
          '__v': 0,
        },
      ],
      'allRelays': [
        {
          '_id': '588a427d617fff11d79b304e',
          'name': 'LED (right)',
          'device': 'light',
          'state': 1,
        },
        {
          '_id': '588a427d617fff11d79b304f',
          'name': 'Ventilation (right)',
          'device': 'fan',
          'state': 1,
        },
        {
          '_id': '588a427d617fff11d79b3050',
          'name': 'Watering (right)',
          'device': 'pump',
          'state': 0,
        },
      ],
    },

    upsertedMainBox: {
      _id: new ObjectId('588a427d617fff11d79b3047'),
      name: 'Main Box',
      cycle: 'mother',
      __v: 0,
      strains: [],
      rules: [
        new ObjectId('588a427d617fff11d79b3054'),
        new ObjectId('588a427d617fff11d79b3054'),
        new ObjectId('588a427d617fff11d79b3054'),
      ],
      light: {
        startTime: new Date('2016-11-28T07:30:00.749Z'),
        durationHOn: 18,
        relay: new ObjectId('588a427d617fff11d79b304e'),
      },
      displays: [new ObjectId('588a427d617fff11d79b304d')],
      cronjobs: [null, null], // is mocked -> return null
    },

    readMainBox: {
      _id: new ObjectId('588a427d617fff11d79b3047'),
      name: 'Main Box',
      cycle: 'mother',
      __v: 0,
      strains: [],
      rules: [
        new ObjectId('588a427d617fff11d79b3054'),
        new ObjectId('588a427d617fff11d79b3056'),
        new ObjectId('588a427d617fff11d79b3058'),
      ],
      light: {
        relay: new ObjectId('588a427d617fff11d79b304e'),
        durationHOn: 18,
        startTime: new Date('2016-11-28T07:30:00.749Z'),
      },
      displays: [new ObjectId('588a427d617fff11d79b304d')],
      activeSensors: [],
      allRelays: [],
      cronjobs: [],
    },
  })
;

const cronjobDummies = () =>
  [
    {
      _id: new ObjectId('588a427d617fff11d79b3066'),
      relay: {
        _id: new ObjectId('588a427d617fff11d79b304e'),
        label: 'Relay I',
        name: 'LED (right)',
        address: 1,
      },
      action: 'switchOn',
      cronPattern: '0 30 7 * * *',
    },
    {
      _id: new ObjectId('588a427d617fff11d79b3067'),
      relay: {
        _id: new ObjectId('588a427d617fff11d79b304e'),
        label: 'Relay I',
        name: 'LED (right)',
        address: 1,
      },
      action: 'switchOff',
      cronPattern: '0 30 19 * * *',
    },
  ]
;
module.exports = {chamberDummies, cronjobDummies};
