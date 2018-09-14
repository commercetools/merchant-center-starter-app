import React from 'react';
import { Provider as StoreProvider } from 'react-redux';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
// import { fireEvent, waitForElement } from 'react-testing-library';
import { createMiddleware } from '@commercetools-frontend/sdk';
import { render } from './test-utils';
import ChannelsList from './channels-list';

const testProjectKey = 'test-1';

let mockedResponsesByUri = {};

const mockedResponse = ({ uri }) => {
  const response = mockedResponsesByUri[uri]();
  if (!response) throw new Error(`No mock found for uri ${uri}`);
  return response;
};

jest.mock('@commercetools-frontend/sdk/utils');
jest.mock('@commercetools/sdk-client', () => ({
  createClient: () => ({
    execute: mockedResponse,
  }),
}));

const mockStore = configureStore([
  thunk,
  createMiddleware({
    getCorrelationId: () => 1,
    getProjectKey: () => testProjectKey,
  }),
]);
const store = mockStore();

const mockQuery = (key, valueResolver) => {
  mockedResponsesByUri = {
    ...mockedResponsesByUri,
    [key]: valueResolver,
  };
};

const renderWithMockedStore = (ui, options) =>
  render(<StoreProvider store={store}>{ui}</StoreProvider>, options);

describe('rendering', () => {
  it('should render channels list', async () => {
    // Define the mock for the channels query (using the SDK)
    mockQuery(`/${testProjectKey}/channels?limit=25&offset=0`, () =>
      // Do not return anything for now
      Promise.resolve({ body: {} })
    );

    const { container } = await renderWithMockedStore(
      <ChannelsList projectKey={testProjectKey} />,
      { projectKey: testProjectKey }
    );

    expect(container.firstChild).toMatchSnapshot('Loading spinner');
  });
});
