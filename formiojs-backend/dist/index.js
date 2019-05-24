"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jsonwebtoken = require('jsonwebtoken');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var config = require('./config');
var _ = require('lodash');
var _request = require('request');
var Q = require('q');
var debug = require('debug')('request');

var Formio = function () {
    var _baseUrl = Symbol();
    var _token = Symbol();

    var Formio = function () {
        function Formio(path) {
            _classCallCheck(this, Formio);

            this[_baseUrl] = path;
            this[_token] = '';
        }

        _createClass(Formio, [{
            key: 'loadSubmissions',
            value: function loadSubmissions(form, query) {
                var _this = this;

                return new Promise(function (resolve, reject) {
                    try {
                        var uri = '';
                        var _iteratorNormalCompletion = true;
                        var _didIteratorError = false;
                        var _iteratorError = undefined;

                        try {
                            for (var _iterator = Object.entries(query)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                                var _step$value = _slicedToArray(_step.value, 2),
                                    key = _step$value[0],
                                    value = _step$value[1];

                                uri = uri + key + '=' + value + '&';
                                uri = uri.slice(0, -1);
                            }
                        } catch (err) {
                            _didIteratorError = true;
                            _iteratorError = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion && _iterator.return) {
                                    _iterator.return();
                                }
                            } finally {
                                if (_didIteratorError) {
                                    throw _iteratorError;
                                }
                            }
                        }

                        _this.request('get', _this[_baseUrl] + '/' + form + '/submission?' + uri, null).then(function (submissions) {
                            if (submissions.length !== 0) {
                                return resolve(submissions['body']);
                            } else {
                                throw Error('no results found');
                            }
                        });
                    } catch (e) {
                        console.log(e);
                        return reject();
                    }
                });
            }
        }, {
            key: 'loadSubmission',
            value: function loadSubmission(form, id) {
                var _this2 = this;

                return new Promise(function (resolve, reject) {
                    try {
                        _this2.request('get', _this2[_baseUrl] + '/' + form + '/submission/' + id, null).then(function (submissions) {
                            if (submissions.length !== 0) {
                                return resolve(submissions['body'][0]);
                            } else {
                                throw Error('no results found');
                            }
                        });
                    } catch (e) {
                        console.log(e);
                        return reject();
                    }
                });
            }
        }, {
            key: 'saveSubmission',
            value: function saveSubmission(form, submission, id) {
                var _this3 = this;

                return new Promise(function (resolve, reject) {
                    try {
                        var url = _this3[_baseUrl] + '/' + form + '/submission' + (id !== null ? '/' + id : '');
                        var updated = _this3.request(id !== null ? 'put' : 'post', url, submission);
                        updated.then(function (submissions) {
                            console.log(submissions);
                        });
                    } catch (e) {
                        console.log(e);
                    }
                });
            }
        }, {
            key: 'request',
            value: function request(method, url, data) {
                var deferred = Q.defer();
                method = method || 'get';
                var headers = _.defaults(headers || {}, {
                    'Accept': 'application/json'
                });

                if (!headers.hasOwnProperty('x-jwt-token') && this[_token]) {
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
                    _request(options, function (err, response) {
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
                } catch (err) {
                    deferred.reject(err);
                }
                return deferred.promise;
            }
        }, {
            key: 'setUser',
            value: function setUser(username) {
                var _this4 = this;

                return new Promise(function (resolve, reject) {
                    _this4.loadSubmissions('user', { 'data.username': username }).then(function (submissions) {
                        if (submissions.length !== 0) {
                            var payload = {
                                'form': {
                                    '_id': '5bbd06e474dabf01d50fd082'
                                },
                                'user': {
                                    '_id': submissions[0]._id
                                },
                                'exp': Math.round(new Date().getTime() / 1000 + 28800)
                            };

                            var secret = config.jwt_secret;
                            _this4[_token] = (0, _jsonwebtoken.sign)(payload, secret);
                            resolve(_this4[_token]);
                        }
                    });
                });
            }
        }]);

        return Formio;
    }();

    return Formio;
}();

var formio = new Formio('https://comms.api.rw.selfdesign.org');

formio.setUser('rickwarren').then(function (token) {
    formio.loadSubmissions('learner', { 'data.gradeLevel': '7' }).then(function (submissions) {
        submissions[0].data.displayName = 'aaaaaaaaaaaaaaaa';
        submissions[0].data.parents = [];
        formio.saveSubmission('learner', submissions[0], submissions[0]._id).then(function (updated) {
            console.log(submission);
        });
    });
});