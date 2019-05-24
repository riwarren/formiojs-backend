"use strict";

import { sign } from 'jsonwebtoken';

const config = require('./config');
const _ = require('lodash');
const request = require('request');
const Q = require('q');
const debug = require('debug')('request');

const Formio = (function() {
    const _baseUrl = Symbol();
    const _token = Symbol();

    class Formio {
        constructor(path) {
            this[_baseUrl] = path;
            this[_token] = '';
        }

        loadSubmissions(form, query) {
            return new Promise((resolve, reject) => {
                try {
                    let uri = '';
                    for(const [key, value] of Object.entries(query)) {
                        uri = uri + key + '=' + value + '&';
                        uri = uri.slice(0, -1);
                    }
                    this.request('get', this[_baseUrl] + '/' + form + '/submission?' + uri, null).then((submissions) => {
                        if(submissions.length !== 0) {
                            return resolve(submissions['body']);
                        } else {
                            throw Error('no results found');
                        }
                    });
                } catch(e) {
                    console.log(e);
                    return reject();
                }
            });
        }

        loadSubmission(form, id) {
            return new Promise((resolve, reject) => {
                try {
                    this.request('get', this[_baseUrl] + '/' + form + '/submission/' + id, null).then((submissions) => {
                        if(submissions.length !== 0) {
                            return resolve(submissions['body'][0]);
                        } else {
                            throw Error('no results found');
                        }
                    });
                } catch(e) {
                    console.log(e);
                    return reject();
                }
            });
        }

        saveSubmission(form, submission, id) {
            return new Promise((resolve, reject) => {
                try {
                    let url = this[_baseUrl] + '/' + form + '/submission' + (id !== null ? '/' + id : '');
                    let updated = this.request(id !== null ? 'put' : 'post', url, submission);
                    updated.then(function(submissions) {
                        console.log(submissions);
                    });
                } catch(e) {
                    console.log(e);
                }
            });
        }

        request(method, url, data) {
            var deferred = Q.defer();
            method = method || 'get';
            let headers = _.defaults(headers || {}, {
                'Accept': 'application/json'
            });

           if (
                !headers.hasOwnProperty('x-jwt-token') &&
                this[_token]
            ) {
                headers['x-jwt-token'] = this[_token];
            }

            var options = {
                method: method.toUpperCase(),
                url: url,
                rejectUnauthorized: false,
                headers: headers,
                json: true
            };

            if (data) {
                options.body = data;
            }

            // Execute the request.
            try {
                request(options, function(err, response) {
                    if (err) {
                        return deferred.reject(err);
                    }
                    // Fail for anything other than 200 status code.
                    if (parseInt(response.statusCode / 100, 10) !== 2) {
                        var err = new Error(response.body);
                        err.response = response;
                        return deferred.reject(err);
                    }
                    
                    deferred.resolve(response);
                });
            } catch(err) {
                deferred.reject(err);
            }
            return deferred.promise;
        }

        setUser(username) {
            return new Promise((resolve, reject) => {
                this.loadSubmissions('user', {'data.username': username}).then((submissions) => {
                    if(submissions.length !== 0) {
                        const payload = {
                            'form': {
                                '_id': '5bbd06e474dabf01d50fd082'
                            },
                            'user': {
                                '_id': submissions[0]._id
                            },
                            'exp': Math.round(new Date().getTime() / 1000 + 28800)
                        };

                        const secret = config.jwt_secret;
                        this[_token] = sign(payload, secret);
                        resolve(this[_token]);
                    }
                });
            });
        }
    }

    return Formio;
}());

