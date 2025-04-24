[English](CHANGELOG.md) | [中文](docs/zh/CHANGELOG.md)

# Changelog

## [Unreleased]

### Changed

- Updated README and docs, added 'Recommended Models' section, provided suggestions for optimal models, and highlighted differences in understanding capabilities between models. (5c61b3e)
- Updated task templates, added 'Please strictly follow the instructions below' prompt, enhanced guidance for task execution, analysis, completion, and verification, and adjusted decision point descriptions to improve user experience. (f0283ff)
- Updated README and docs, linked the MIT license, and added a Star History section to display the project's star history. (0bad188)
- Updated README and docs, added table of contents and tags for various functional sections, enhanced descriptions of usage guides and task management processes, and adjusted related content to improve readability and structure. (31065fa)
- Updated task content description, allowing completed tasks to update related file summaries; removed the no-longer-used update task related files tool, and adjusted thought process description to enhance guidance on understanding and solution generation. (b07672c)

### Fixed

- Fix #6: Corrected an issue where simplified/traditional Chinese caused Enum parameter validation errors (dae3756)

## [1.0.8]

### Added

- Added dependency on zod-to-json-schema for better schema integration
- Added detailed task splitting guidelines for better task management
- Added more robust error handling for Agent tool calls

### Changed

- Updated MCP SDK integration for better error handling and compatibility
- Improved task implementation prompt templates for clearer instructions
- Optimized task split tool descriptions and parameter validation

### Fixed

- Fixed issue #5 where some Agents couldn't properly handle errors
- Fixed line formatting in template documents for better readability

## [1.0.7]

### Added

- Added Thought Chain Process feature for systematic problem analysis
- Added Project Rules Initialization feature for maintaining project consistency

### Changed

- Updated documentation to emphasize systematic problem analysis and project consistency
- Adjusted tool list to include new features
- Updated .gitignore to exclude unnecessary folders
