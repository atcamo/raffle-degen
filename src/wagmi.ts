import { configureChains, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { InjectedConnector } from 'wagmi/connectors/injected';

const { chains, publicClient } = configureChains(
  [base],
  [publicProvider()]
);

export const config = createConfig({
  autoConnect: true,
  publicClient,
  connectors: [
    new InjectedConnector({
      chains,
    }),
  ],
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
