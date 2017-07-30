import sys
import os
import time
import pandas as pd
from mail_extractor import extractMailInfo

# Take arguments from script call
# 1. Folder that contains the mails
# 2. File to write the header data to (ends in .csv)
# 3. File to write the image data to (ends in .csv)
mail_folder = sys.argv[1]
output_file_headers = sys.argv[2]
output_file_images = sys.argv[3]

# Set up vars
header_list = []
data_list = []
counter = 1
# Get list of emails in folder
file_list = os.listdir(mail_folder)
#file_list = file_list[0:1000]
print("Number of mails found in folder: " + str(len(file_list)))

# For every email, call function extractMailInfo from script mail_extractor.py
start = time.time()
for file in file_list:
    try:
        temp = extractMailInfo(os.path.join(mail_folder, file), mailCounter = counter, srcDiff = True)
        header_list.append(temp[0])
        data_list.extend(temp[1])
    except:
        print('Error extracting file' + str(file))
        
    if counter % 1000 == 0:
        print("Extracted mail number " + str(counter))
        print("Expected minutes remaining: " + str( (time.time() - start) * (len(file_list) - counter) / (60 * counter )))
    counter += 1

# Save the data to csv tables using pandas functions
print(str((time.time() - start) / 60))
header_dataframe = pd.DataFrame.from_records(header_list)
data_dataframe = pd.DataFrame.from_records(data_list)
print("Dimensions of headers table (rows x columns):" + str(header_dataframe.shape))
header_dataframe.to_csv(output_file_headers, index = False)
print("Dimensions of images table (rows x columns):" + str(data_dataframe.shape))
data_dataframe.to_csv(output_file_images, index = False)
print("Data printed to " + output_file_images)
