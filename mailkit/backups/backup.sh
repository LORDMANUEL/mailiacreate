#!/bin/sh
set -e

# Set the restic repository path
export RESTIC_REPOSITORY=/backups

# Set the restic password
export RESTIC_PASSWORD=password

# Backup the volumes
restic backup /data
