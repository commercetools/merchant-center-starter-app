// This file allows consumers of the application-shell to test
// components rendered by the application shell.
// They should
// import { render } from ""@commercetools-frontend/application-shell/test-utils"
// and then use it together with react-testing-library.
import React from 'react';
import { Router } from 'react-router-dom';
import { render as rtlRender } from 'react-testing-library';
import { createMemoryHistory } from 'history';
import { IntlProvider } from 'react-intl';
import { MockedProvider as ApolloMockProvider } from 'react-apollo/test-utils';
import { ConfigureFlopFlip } from '@flopflip/react-broadcast';
import memoryAdapter from '@flopflip/memory-adapter';
import {
  FetchUser,
  FetchProject,
} from '@commercetools-frontend/application-shell';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import ProjectQuery from './project.graphql';
import UserQuery from './user.graphql';

// Reset memoryAdapter after each test, so that the next test accepts the
// defaultFlags param.
// This could also be moved into setup-test-framework, not sure which
// location is better for it.
afterEach(memoryAdapter.reset);

// TODO: define proper response data
const createDefaultMocks = ({ projectKey }) => [
  {
    request: {
      query: UserQuery,
      variables: { target: GRAPHQL_TARGETS.MERCHANT_CENTER_BACKEND },
    },
    result: {
      data: {
        user: {
          id: 'u1',
          email: '',
          gravatarHash: '',
          firstName: '',
          lastName: '',
          language: 'en',
          numberFormat: '',
          timeZone: '',
          launchdarklyTrackingId: '',
          launchdarklyTrackingGroup: '',
          launchdarklyTrackingTeam: '',
          defaultProjectKey: '',
          projects: {
            total: 1,
            results: [
              {
                name: 'p1',
                key: 'p1',
                suspension: {
                  isActive: false,
                },
                expired: false,
              },
            ],
          },
        },
      },
    },
  },
  {
    request: {
      query: ProjectQuery,
      variables: {
        target: GRAPHQL_TARGETS.MERCHANT_CENTER_BACKEND,
        projectKey,
      },
    },
    result: {
      data: {
        project: {
          key: '',
          version: '',
          name: '',
          countries: '',
          currencies: '',
          languages: '',
          expiry: {
            isActive: false,
            daysLeft: null,
          },
          suspension: {
            isActive: false,
          },
          permissions: {
            canManageOrganization: true,
            canManageProject: true,
            canViewProjectSettings: true,
            canViewProducts: true,
            canManageProducts: true,
            canViewOrders: true,
            canManageOrders: true,
            canViewCustomers: true,
            canManageCustomers: true,
            canViewTypes: true,
            canManageTypes: true,
            canViewPayments: true,
            canManagePayments: true,
          },
          owner: {
            id: 'o1',
            name: '',
            createdAt: '',
            teams: {
              count: 0,
            },
          },
          settings: {
            id: '',
            baseSettings: {
              id: '',
              userProjectSettings: '',
              pluginPreset: null,
              orderStatesVisibility: {
                isPaymentStateHidden: false,
                isShipmentStateHidden: false,
                isOrderStateHidden: false,
              },
            },
            productSettings: '',
            currentProductSettings: '',
          },
        },
      },
    },
  },
];

const holdOn = (amount = 0) =>
  new Promise(resolve => setTimeout(resolve, amount));

// This function renders any component within the application context.
// The context is not completely set up yet, some things are missing:
//   - Redux
//   - Tracking on context
//   - Project information
//   - possibly more that I'm not aware of right now
//
//  We can add these things as we go and when we need them.
//
// Inspired by
// https://github.com/kentcdodds/react-testing-library-course/blob/2a5b1560656790bb1d9c055fba3845780b2c2c97/src/__tests__/react-router-03.js
// eslint-disable-next-line import/prefer-default-export
export const render = async (ui, options = {}) => {
  const { projectKey = 'test-1' } = options;
  const {
    // react-intl
    locale = 'en',
    // Apollo
    mocks = createDefaultMocks({ projectKey }),
    addTypename = false,
    // react-router
    route = '/',
    history = createMemoryHistory({ initialEntries: [route] }),
    // flopflip
    adpater = memoryAdapter,
    flags = {},
    // forwarding to react-testing-library
    ...renderOptions
  } = options;
  const rendered = {
    ...rtlRender(
      <IntlProvider locale={locale}>
        <ApolloMockProvider mocks={mocks} addTypename={addTypename}>
          <ConfigureFlopFlip adapter={adpater} defaultFlags={flags}>
            <Router history={history}>
              <FetchUser>
                {({ isLoading: isLoadingUser }) => {
                  if (isLoadingUser) {
                    return null;
                  }
                  return (
                    <FetchProject projectKey={projectKey}>
                      {({ isLoading: isLoadingProject }) => {
                        if (isLoadingProject) {
                          return null;
                        }
                        return ui;
                      }}
                    </FetchProject>
                  );
                }}
              </FetchUser>
            </Router>
          </ConfigureFlopFlip>
        </ApolloMockProvider>
      </IntlProvider>,
      renderOptions
    ),
    // adding `history` to the returned utilities to allow us
    // to reference it in our tests (just try to avoid using
    // this to test implementation details).
    history,
    // return also `projectKey` in case it's the default value
    projectKey,
  };
  // wait for the user query to finish
  await holdOn();
  // wait for the project query to finish
  await holdOn();
  return rendered;
};
