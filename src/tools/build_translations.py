#!/usr/bin/env python

# chicken scratches for now

## locale mapping; these are the locales supported by tf2, which form
## subset of the locales supported by chrome.
locale_files = [
    ('en', 'tf2_english.txt'),

    ('da', 'tf_danish.txt'),
    ('nl', 'tf_dutch.txt'),
    ('fi', 'tf_finnish.txt'),
    ('fr', 'tf_french.txt'),
    ('de', 'tf_german.txt'),
    ('it', 'tf_italian.txt'),
    ('ja', 'tf_japanese.txt'),
    ('ko', 'tf_korean.txt'),
## what?    ('', 'tf_koreana.txt'),
    ('no', 'tf_norwegian.txt'),
    ('pl', 'tf_polish.txt'),
    ('pt', 'tf_portuguese.txt'),
    ('zh_CN', 'tf_schinese.txt'),
    ('es', 'tf_spanish.txt'),
    ('sv', 'tf_swedish.txt'),
    ('zh_TW', 'tf_tchinese.txt'),
]

## messages we can't (or don't want to) get from one of the tf_*.txt files.

local_messages = {
    'en' : {
        '0'  : 'TF2 Backpack Access', ## page title
        '1'  : 'Profile ID Not Set!', ## no steam id title
        '2'  : 'To use the TF2 Backpack Access extension, enter your community '
              'name or profile id here.', # no steam id help
        '3'  : '(e.g., pnatural or 76561197992805111)', # no steam id example
        '4'  : 'Save', # save button
        '5'  : 'Reset', # reset button
        '6'  : 'Close', # close button
        '7'  : 'Character Info for $1', # character info title
        '8'  : 'New Items', # new items title
        '9'  : 'Backpack', # backpack title
        '10' : 'Refresh', # refresh button
        '11' : 'Options', # options button
        '12' : 'Stats', # stats button
        '13' : 'Total Items', # total item count stats title
        '14' : 'Normal Items', # normal item count stats title
        '15' : 'Hats', # hat count stats title,
        '16' : 'Unknown Items', # unknown item count stats title,
        '17' : 'Metal Items', # metal item count stats title,
        '18' : 'Metal Worth', # metal worth item count,
        '19' : 'Profile Views', # count of profile views,
        '20' : 'Cache Time', # time feed cached
        '21' : 'Last Fetch', # time of last fetch
        '22' : 'Next Fetch', # time of next fetch
        '23' : 'Request Time', # duration of request
        '24' : 'Hide Stats', # hide stats button
        '25' : '$1 View Backpack $2 at TF2Items.com',
        '26' : '$1 View Profile $2 at the Steam Community',
        '27' : 'Powered by $1 SourceOP.com $2',
        '28' : 'Extension by $1 pnatural $2',
        },
}
