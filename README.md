## init

```dotnetcli
cd move
aptos init --network devnet
```

A `move/.aptos/config.yaml` will be created, and cp it `indexlist_addr` in Move.toml file.

## Publish todolist module to chain

```dotnetcli
cd move
aptos move test
aptos move compile
aptos move publish
```

You can now head to the [Aptos Explore](https://explorer.aptoslabs.com/?network=devnet).

https://aptos.dev/tutorials/build-e2e-dapp/create-a-smart-contract#publish-todolist-module-to-chain
