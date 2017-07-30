You need:
- A folder with text e-mails, where each e-mail is a file
- A rds file containing the trained classification model

1. Use the command line to run:
python3 extract_folder.py "[folder path]" "[output path/]images.csv" "[output path/]header.csv"

The script parses the emails and saves the image and header information into the files that are specified as second and third argument, respectively

2. Use RStudio to run test.R
This script will 
- load the model
- open a connection to the data in ndjson format
- load the functions 'detectionEngine.R', 'helperfunctions.R' and 'feature_extraction.R'
- call detectTracking() to analyze the images
