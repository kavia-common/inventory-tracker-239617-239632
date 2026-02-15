#!/bin/bash
cd /home/kavia/workspace/code-generation/inventory-tracker-239617-239632/stock_check_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

