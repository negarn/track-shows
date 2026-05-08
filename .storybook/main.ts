import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-essentials"],
  framework: {
    name: "@storybook/react-vite",
    options: {}
  },
  async viteFinal(config) {
    return {
      ...config,
      plugins: Array.isArray(config.plugins)
        ? config.plugins.filter((plugin) => plugin?.name !== "track-shows-api")
        : config.plugins
    };
  }
};

export default config;
