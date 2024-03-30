import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';
import { Layout, Row, Col, Button, Spin, List, Checkbox, Input } from 'antd';

import React, { useEffect, useState } from 'react';
import {
  useWallet,
  InputTransactionData,
} from '@aptos-labs/wallet-adapter-react';

import '@aptos-labs/wallet-adapter-ant-design/dist/index.css';
import { CheckboxChangeEvent } from 'antd/es/checkbox';
import { Aptos } from '@aptos-labs/ts-sdk';

type Site = {
  site_id: string;
  address: string;
  domain: string;
  isApproved?: boolean;
  isEvil?: boolean;
};

export const aptos = new Aptos();
export const moduleAddress = process.env.REACT_APP_MODULE_ADDRESS || '';

function App() {
  const [sites, setSites] = useState<Site[]>([]);
  const [newSite, setNewSite] = useState<string>('');
  const { account, signAndSubmitTransaction } = useWallet();
  const [accountHasList, setAccountHasList] = useState<boolean>(false);
  const [transactionInProgress, setTransactionInProgress] =
    useState<boolean>(false);

  const onWriteSite = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setNewSite(value);
  };

  const fetchList = async () => {
    if (!account) return [];
    try {
      const indexListResource = await aptos.getAccountResource({
        accountAddress: account?.address,
        resourceType: `${moduleAddress}::indexlist::SiteIndex`,
      });
      setAccountHasList(true);
      // sites table handle
      const tableHandle = (indexListResource as any).sites.handle;
      // sites table counter
      const siteCounter = (indexListResource as any).site_counter;

      let sites = [];
      let counter = 1;
      while (counter <= siteCounter) {
        const tableItem = {
          key_type: 'u64',
          value_type: `${moduleAddress}::indexlist::Site`,
          key: `${counter}`,
        };
        const site = await aptos.getTableItem<Site>({
          handle: tableHandle,
          data: tableItem,
        });
        sites.push(site);
        counter++;
      }
      // set sites in local state
      setSites(sites);
    } catch (e: any) {
      setAccountHasList(false);
    }
  };

  const addNewList = async () => {
    if (!account) return [];
    setTransactionInProgress(true);

    const transaction: InputTransactionData = {
      data: {
        function: `${moduleAddress}::indexlist::create_index`,
        functionArguments: [],
      },
    };
    try {
      // sign and submit transaction to chain
      const response = await signAndSubmitTransaction(transaction);
      // wait for transaction
      await aptos.waitForTransaction({ transactionHash: response.hash });
      setAccountHasList(true);
    } catch (error: any) {
      setAccountHasList(false);
    } finally {
      setTransactionInProgress(false);
    }
  };

  const onSiteAdded = async () => {
    // check for connected account
    if (!account) return;
    setTransactionInProgress(true);

    const transaction: InputTransactionData = {
      data: {
        function: `${moduleAddress}::indexlist::register_site`,
        functionArguments: [newSite],
      },
    };

    // hold the latest site.site_id from our local state
    const latestId =
      sites.length > 0 ? parseInt(sites[sites.length - 1].site_id) + 1 : 1;

    // build a newSiteToPush objct into our local state
    const newSiteToPush = {
      address: account.address,
      isEvil: false,
      domain: newSite,
      site_id: latestId + '',
    };

    try {
      // sign and submit transaction to chain
      const response = await signAndSubmitTransaction(transaction);
      // wait for transaction
      await aptos.waitForTransaction({ transactionHash: response.hash });

      // Create a new array based on current state:
      let newSites = [...sites];

      // Add item to the sites array
      newSites.push(newSiteToPush);
      // Set state
      setSites(newSites);
      // clear input text
      setNewSite('');
    } catch (error: any) {
      console.log('error', error);
    } finally {
      setTransactionInProgress(false);
    }
  };

  const onCheckboxChange = async (
    event: CheckboxChangeEvent,
    siteId: string
  ) => {
    if (!account) return;
    if (!event.target.checked) return;
    setTransactionInProgress(true);
    const transaction: InputTransactionData = {
      data: {
        function: `${moduleAddress}::indexlist::approve_site`,
        functionArguments: [siteId],
      },
    };
    try {
      // sign and submit transaction to chain
      const response = await signAndSubmitTransaction(transaction);
      // wait for transaction
      await aptos.waitForTransaction({ transactionHash: response.hash });
      setSites((prevState) => {
        const newState = prevState.map((obj) => {
          // if site_id equals the checked siteId, update completed property
          if (obj.site_id === siteId) {
            return { ...obj, completed: true };
          }
          // otherwise return object as is
          return obj;
        });
        return newState;
      });
    } catch (error: any) {
      console.log('error', error);
    } finally {
      setTransactionInProgress(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [account?.address]);

  return (
    <>
      <Layout>
        <Row align='middle'>
          <Col span={10} offset={2}>
            <h1>Our indexlist</h1>
          </Col>
          <Col span={12} style={{ textAlign: 'right', paddingRight: '200px' }}>
            <WalletSelector />
          </Col>
        </Row>
      </Layout>
      <Spin spinning={transactionInProgress}>
        {!accountHasList ? (
          <Row gutter={[0, 32]} style={{ marginTop: '2rem' }}>
            <Col span={8} offset={8}>
              <Button
                disabled={!account}
                block
                onClick={addNewList}
                type='primary'
                style={{ height: '40px', backgroundColor: '#3f67ff' }}
              >
                Add new site list
              </Button>
            </Col>
          </Row>
        ) : (
          <Row gutter={[0, 32]} style={{ marginTop: '2rem' }}>
            <Col span={8} offset={8}>
              <Input.Group compact>
                <Input
                  onChange={(event) => onWriteSite(event)}
                  style={{ width: 'calc(100% - 60px)' }}
                  placeholder='Add a Site'
                  size='large'
                  value={newSite}
                />
                <Button
                  onClick={onSiteAdded}
                  type='primary'
                  style={{ height: '40px', backgroundColor: '#3f67ff' }}
                >
                  Add
                </Button>
              </Input.Group>
            </Col>
            <Col span={8} offset={8}>
              {sites && (
                <List
                  size='small'
                  bordered
                  dataSource={sites}
                  renderItem={(site: Site) => (
                    <List.Item
                      actions={[
                        <div>
                          {site.isApproved ? (
                            <Checkbox defaultChecked={true} disabled />
                          ) : (
                            <Checkbox
                              onChange={(event) =>
                                onCheckboxChange(event, site.site_id)
                              }
                            />
                          )}
                        </div>,
                      ]}
                    >
                      <List.Item.Meta
                        title={site.domain}
                        description={
                          <a
                            href={`https://explorer.aptoslabs.com/account/${site.address}/`}
                            target='_blank'
                          >{`${site.address.slice(0, 6)}...${site.address.slice(
                            -5
                          )}`}</a>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Col>
          </Row>
        )}
      </Spin>
    </>
  );
}

export default App;
