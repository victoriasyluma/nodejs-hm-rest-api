const Contacts = require('../models/contacts');

const HttpError = require('../helpers/HttpError');

const getAll = async (req, res, next) => {
  try {
    const { _id: owner } = req.user;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const result = await Contacts.find({ owner }, '-createdAt -updatedAt', {
      skip,
      limit,
    }).populate('owner', 'name email');

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getContactById = async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const result = await Contacts.findById(contactId);

    if (!result) {
      throw HttpError(404, `Contact with id=${contactId} not found`);
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const addNewContact = async (req, res, next) => {
  try {
    const { _id: owner } = req.user;
    const result = await Contacts.create({ ...req.body, owner });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteContact = async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const result = await Contacts.findByIdAndDelete(contactId);

    if (result) {
      res.status(200).json({ message: 'contact deleted' });
    } else {
      throw HttpError(404, `Contact with id=${contactId} not found`);
    }
  } catch (error) {
    next(error);
  }
};

const updateContact = async (req, res, next) => {
  try {
    const { contactId: id } = req.params;

    const result = await Contacts.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!result) {
      throw HttpError(404, `Not Found`);
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updateStatusContact = async (req, res, next) => {
  try {
    const { contactId: id } = req.params;

    const result = await Contacts.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!result) {
      throw HttpError(404, `Not Found`);
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  addNewContact,
  getContactById,
  updateContact,
  updateStatusContact,
  deleteContact,
};
