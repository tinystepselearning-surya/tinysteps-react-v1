# Functions

This directory contains the Cloud Functions for the primary `tinysteps-react-v1`
Firebase project and their maintenance helpers.

Ask Tiny Steps no longer runs through Cloud Functions. Its public web client uses
Firebase AI Logic on the separate `tiny-steps-ask-ai` project. Keep AI project
configuration out of this directory and never add Gemini API secrets.
