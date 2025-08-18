#!/usr/bin/env node

// Test script for Docker container project system
import { createProject, listProjects, getDefaultProject } from './dist/models/projectModel.js';

async function testDockerProjects() {
  console.log('🐳 Testing Docker Container Project System...\n');

  try {
    // Test 1: List current projects
    console.log('📋 Test 1: Listing current projects...');
    const projects = await listProjects();
    console.log(`Found ${projects.length} projects`);
    console.log('Projects:', projects.map(p => p.name));
    console.log('');

    // Test 2: Get default project
    console.log('🏠 Test 2: Getting default project...');
    const defaultProject = await getDefaultProject();
    console.log(`Default project: ${defaultProject}`);
    console.log('');

    // Test 3: Create a Docker test project
    console.log('➕ Test 3: Creating Docker test project...');
    const result = await createProject('docker-test', 'A test project in Docker container', false);
    if (result.success) {
      console.log('✅ Docker test project created successfully!');
      console.log(`Project ID: ${result.project?.id}`);
      console.log(`Project Name: ${result.project?.name}`);
    } else {
      console.log('❌ Failed to create Docker test project:', result.error);
    }
    console.log('');

    // Test 4: List projects again
    console.log('📋 Test 4: Listing projects after creation...');
    const projectsAfter = await listProjects();
    console.log(`Found ${projectsAfter.length} projects`);
    console.log('Projects:', projectsAfter.map(p => p.name));
    console.log('');

    console.log('🎉 Docker project management system test completed!');

  } catch (error) {
    console.error('❌ Docker test failed:', error);
  }
}

testDockerProjects().catch(console.error);
