import re
import email
from email.header import decode_header
from email.parser import Parser
from bs4 import BeautifulSoup as BS
import difflib
import numpy as np


### Extract email header
def getheaders(msg):
    regular_header = ['bounces-to', 'date', 'delivered-to', 'message-id', 'return-path',
                      'errors-to', 'from', 'importance', 'list-help', 'list-id', 'list-owner',
                      'list-post', 'reply-to', 'received-spf', 'sender', 'subject', 'list-unsubscribe',
                      'content-type']
    msg_headers = {field.lower(): msg[field] for field in msg if field.lower() in regular_header}
    received = msg.get_all('received')
    msg_headers["received"] = received[-1]
    return msg_headers


# def getmailheader(header_text, default="ascii"):
#     """Decode header_text if needed"""
#     try:
#         headers=decode_header(header_text)
#     except email.Errors.HeaderParseError:
#         # This already append in email.base64mime.decode()
#         # instead return a sanitized ascii string 
#         return header_text.encode('ascii', 'replace').decode('ascii')
#     else:
#         for i, (text, charset) in enumerate(headers):
#             try:
#                 headers[i]=unicode(text, charset or default, errors='replace')
#             except LookupError:
#                 # if the charset is unknown, force default 
#                 headers[i]=unicode(text, default, errors='replace')
#         return u"".join(headers)

# def getmailaddresses(msg, name):
#     """retrieve From:, To: and Cc: addresses"""
#     addrs=email.utils.getaddresses(msg.get_all(name, []))
#     for i, (name, addr) in enumerate(addrs):
#         if not name and addr:
#             # only one string! Is it the address or is it the name ?
#             # use the same for both and see later
#             name=addr
#             
#         try:
#             # address must be ascii only
#             addr=addr.encode('ascii')
#         except UnicodeError:
#             addr=''
#         else:
#             # address must match adress regex
#             if not email_address_re.match(addr):
#                 addr=''
#         addrs[i]=(getmailheader(name), addr)
#     return addrs

###########################
### Extract email body ####
###########################
def getbodysoup(msg):
    if msg.is_multipart():
        msg_list = []
        for part in msg.walk():
            if part.get_payload(decode=True) != None:
                msg_list.append(str(part.get_payload(decode=True)))
        msg_body = ' '.join(msg_list)
    else:
        msg_body = msg.get_payload(decode=True)
    # msg_body = unicode(msg_body, errors='replace')
    return BS(msg_body, 'lxml')


### Extract email images
def getimgtags(soup, file_path):
    img_list = []
    img_tags = {}
    regular_tags = ['alt', 'align', 'border', 'border-style', 'class', 'contextmenu', 'dir', 'height',
                    'hidden', 'hspace', 'id', 'ismap', 'lang', 'longdesc', 'src', 'style', 'tabindex', 'title',
                    'usemap', 'vspace', 'valign', 'width']
    # 'max-height','max-width',
    for img in soup.find_all('img'):
        img_tags = img.attrs
        img_tags_std = {tag: img_tags[tag] for tag in regular_tags if tag in img_tags.keys()}
        if len(img_tags_std) > 0:
            img_tags_std['exist_custom_keys'] = 1 if len(img_tags) > len(img_tags_std) else 0
            for key in img_tags_std.keys():
                if img_tags_std[key] == None:
                    img_tags_std[key] = "CODEERR"

        if "style" in img_tags.keys():
            regular_styles = ['style', 'color', 'font-family', 'font-size', 'text-align', 'height', 'width', 'display',
                              'opacity',
                              'max-width', 'max-height', 'margin', 'background-color']
            styleoptions = re.split("; *", img_tags["style"])
            styleoptions = [x for x in styleoptions if ':' in x]
            stylelist = {str(re.split(": *", s)[0]): re.split(": *", s)[1] for s in styleoptions}
            stylelist = {'style_' + key: stylelist[key] for key in stylelist if key in regular_styles}
            img_tags_std.update(stylelist)
            del img_tags_std['style']

        img_list.append(img_tags_std)
    return img_list


### Extract email text
# def visible(element):
#     if element.parent.name in ['style', 'script', '[document]', 'head', 'title']:
#         return False
#     elif re.match('<!--.*-->', str(element.encode('utf-8'))):
#         return False
#     return True

def gettext(soup):
    return soup.body.getText("\n")


##########################################
#### Wrapper Function ####################
##########################################
def extractMailInfo(file_path, mailCounter=None, srcDiff=False):
    # Parse email
    with open(file_path) as fp:
        msg = Parser().parse(fp)

        header = getheaders(msg)

        body = getbodysoup(msg)
        imgtags = getimgtags(body, file_path)
        if imgtags == []:
            imgtags = [{"src": "NoImages"}]
        # text = gettext(body)

        if mailCounter != None:
            header["mailCounter"] = mailCounter
            for img in imgtags:
                # img.update(header)
                img["mailCounter"] = mailCounter

        if srcDiff == True:
            i = 0
            temp = [x for x in imgtags if "src" in x.keys()]
            for img in imgtags:
                img['avgLinkSimilarity'] = 0
                img['minLinkSimilarity'] = 0
                img['maxLinkSimilarity'] = 0
                img['countIdenticalImg'] = 0
                if 'src' in img.keys() and len(temp) > 1:
                    indices = list(range(max(0,i-4), min(i+4, len(temp)-1)+1))
                    temp2 = [temp[j] for j in indices if j != i]
                    simratios = [difflib.SequenceMatcher(None, a=img['src'], b=otherImg['src']).ratio() for otherImg in temp2]
                    img['avgLinkSimilarity'] = np.mean(simratios)
                    img['minLinkSimilarity'] = min(simratios)
                    img['maxLinkSimilarity'] = max(simratios)
                    img['countIdenticalImg'] = simratios.count(1)
                    i += 1
                
    return [header, imgtags]
