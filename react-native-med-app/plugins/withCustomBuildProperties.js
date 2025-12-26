const { withProjectBuildGradle, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withCustomBuildProperties = (config) => {
  // Force Gradle 8.7 in gradlew wrapper
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const file = path.join(config.modRequest.platformProjectRoot, 'gradle', 'wrapper', 'gradle-wrapper.properties');
      if (fs.existsSync(file)) {
          const contents = fs.readFileSync(file, 'utf8');
          const newContents = contents.replace(
            /distributionUrl=.*/,
            'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.7-all.zip'
          );
          fs.writeFileSync(file, newContents);
      }
      return config;
    },
  ]);

  // Force AGP 8.2.1 in root build.gradle
  config = withProjectBuildGradle(config, (config) => {
    if (config.modResults.contents.includes('com.android.tools.build:gradle')) {
        config.modResults.contents = config.modResults.contents.replace(
            /classpath\(['"]com\.android\.tools\.build:gradle.*['"]\)/,
            "classpath('com.android.tools.build:gradle:8.2.1')"
        );
    }
    return config;
  });

  return config;
};

module.exports = withCustomBuildProperties;
