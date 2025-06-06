/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Exception } from '@opentelemetry/api';
import { DB_SYSTEM_NAME_VALUE_POSTGRESQL } from '@opentelemetry/semantic-conventions';
import { DB_SYSTEM_NAME_VALUE_SQLITE } from './semconv';

type KnexError = Error & {
  code?: string;
};

export const getFormatter = (runner: any) => {
  if (runner) {
    if (runner.client) {
      if (runner.client._formatQuery) {
        return runner.client._formatQuery.bind(runner.client);
      } else if (runner.client.SqlString) {
        return runner.client.SqlString.format.bind(runner.client.SqlString);
      }
    }
    if (runner.builder) {
      return runner.builder.toString.bind(runner.builder);
    }
  }
  return () => '<noop formatter>';
};

export function otelExceptionFromKnexError(
  err: KnexError,
  message: string
): Exception {
  if (!(err && err instanceof Error)) {
    return err;
  }

  return {
    message,
    code: err.code,
    stack: err.stack,
    name: err.name,
  };
}

const systemMap = new Map([
  ['sqlite3', DB_SYSTEM_NAME_VALUE_SQLITE],
  ['pg', DB_SYSTEM_NAME_VALUE_POSTGRESQL],
]);

export const mapSystem = (knexSystem: string) => {
  return systemMap.get(knexSystem) || knexSystem;
};

export const getName = (db: string, operation?: string, table?: string) => {
  if (operation) {
    if (table) {
      return `${operation} ${db}.${table}`;
    }
    return `${operation} ${db}`;
  }
  return db;
};

export const limitLength = (str: string, maxLength: number) => {
  if (
    typeof str === 'string' &&
    typeof maxLength === 'number' &&
    0 < maxLength &&
    maxLength < str.length
  ) {
    return str.substring(0, maxLength) + '..';
  }
  return str;
};

export const extractTableName = (builder: any): string => {
  const table = builder?._single?.table;
  if (typeof table === 'object') {
    return extractTableName(table);
  }
  return table;
};
